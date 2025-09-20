import { useState, useEffect, useRef } from 'react'
import { ref, set, get, onValue, update, push } from 'firebase/database'
import { database } from '../services/firebase'
import {
  generateAlerts,
  sortAlertsByPriority,
  getActiveAlerts,
  groupAlertsBySite,
  getAlertCounts,
  DEFAULT_THRESHOLDS,
  startAutoCleanup,
  stopAutoCleanup,
  cleanupAlertHistory,
  cleanupMemoryCache,
  getCacheStatus
} from '../utils/alertSystem'
import { debug, error as logError } from '../utils/log'

/**
 * Phase 14E: 경고 시스템 관리 훅
 * 경고 생성, 저장, 조회, 확인 기능 제공
 */
export const useAlertSystem = () => {
  const [alerts, setAlerts] = useState([])
  const [alertHistory, setAlertHistory] = useState([])
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS)
  const [alertStats, setAlertStats] = useState({
    total: 0,
    active: 0,
    acknowledged: 0,
    byType: {}
  })
  const [isLoading, setIsLoading] = useState(true)

  const alertsRef = useRef([])
  const sensorListenersRef = useRef({})
  const thresholdCacheRef = useRef({}) // { [siteId|null]: { ts, data } }

  /**
   * 임계값 설정 로드 (사이트별 + 전역 기본값)
   */
  const loadThresholds = async (siteId = null) => {
    try {
      // Cache hit (30s TTL)
      const cacheKey = siteId || '__global__'
      const cached = thresholdCacheRef.current[cacheKey]
      const now = Date.now()
      if (cached && now - cached.ts < 30_000) {
        debug('⚡ 임계값 캐시 사용:', cacheKey)
        setThresholds(prev => ({ ...prev, ...cached.data }))
        return cached.data
      }

      // 전역 기본값으로 시작
      let loadedThresholds = { ...DEFAULT_THRESHOLDS }

      // 전역 설정 로드
      const globalThresholdsRef = ref(database, 'settings/thresholds/global')
      const globalSnapshot = await get(globalThresholdsRef)
      if (globalSnapshot.exists()) {
        const globalThresholds = globalSnapshot.val()
        loadedThresholds = {
          ...loadedThresholds,
          ...globalThresholds
        }
      }

      // 특정 사이트 설정 로드 (사이트별 우선)
      if (siteId) {
        const siteThresholdsRef = ref(database, `settings/thresholds/sites/${siteId}`)
        const siteSnapshot = await get(siteThresholdsRef)
        if (siteSnapshot.exists()) {
          const siteThresholds = siteSnapshot.val()
          // 사이트별 설정이 있는 센서만 덮어쓰기
          Object.keys(siteThresholds).forEach(sensorType => {
            loadedThresholds[sensorType] = {
              ...loadedThresholds[sensorType],
              ...siteThresholds[sensorType]
            }
          })
        }
      }

      setThresholds(loadedThresholds)
      thresholdCacheRef.current[cacheKey] = { ts: Date.now(), data: loadedThresholds }
      return loadedThresholds
    } catch (error) {
      logError('임계값 로드 오류:', error)
      return DEFAULT_THRESHOLDS
    }
  }

  /**
   * 임계값 설정 저장 (전역 또는 사이트별)
   */
  const saveThresholds = async (newThresholds, siteId = null) => {
    try {
      let thresholdsRef
      if (siteId) {
        thresholdsRef = ref(database, `settings/thresholds/sites/${siteId}`)
        console.log(`✅ ${siteId} 사이트별 임계값 설정 저장 완료`)
      } else {
        thresholdsRef = ref(database, 'settings/thresholds/global')
        console.log('✅ 전역 임계값 설정 저장 완료')
      }

      await set(thresholdsRef, newThresholds)
      setThresholds(newThresholds)
      return true
    } catch (error) {
      console.error('임계값 저장 오류:', error)
      return false
    }
  }

  /**
   * 특정 사이트의 임계값 로드
   */
  const loadSiteThresholds = async (siteId) => {
    return await loadThresholds(siteId)
  }

  /**
   * 센서 데이터 기반 경고 생성 및 저장
   */
  const processAlerts = async (siteId, sensorKey, sensorData, sensorType) => {
    // 사이트별 임계값 로드
    const siteThresholds = await loadSiteThresholds(siteId)
    const currentThresholds = siteThresholds[sensorType]
    if (!currentThresholds) return

    // 경고 생성
    const newAlerts = generateAlerts(
      sensorData,
      sensorType,
      siteId,
      sensorKey,
      currentThresholds
    )

    // 새로운 경고가 있는 경우에만 처리
    if (newAlerts.length > 0) {
      // 더 강화된 중복 체크
      const filteredAlerts = newAlerts.filter(newAlert => {
        // alertsRef.current가 배열인지 확인
        const currentAlerts = Array.isArray(alertsRef.current) ? alertsRef.current : []

        // 동일한 사이트, 센서, 타입의 활성 알림이 있는지 확인
        const hasActiveAlert = currentAlerts.some(existingAlert =>
          !existingAlert.acknowledged &&
          existingAlert.siteId === newAlert.siteId &&
          existingAlert.sensorKey === newAlert.sensorKey &&
          existingAlert.type === newAlert.type
        )

        // 최근 5분 내에 동일한 알림이 생성되었는지 확인 (스팸 방지)
        const recentThreshold = Date.now() - (5 * 60 * 1000) // 5분
        const hasRecentAlert = currentAlerts.some(existingAlert =>
          existingAlert.siteId === newAlert.siteId &&
          existingAlert.sensorKey === newAlert.sensorKey &&
          existingAlert.type === newAlert.type &&
          existingAlert.timestamp > recentThreshold
        )

        return !hasActiveAlert && !hasRecentAlert
      })

      if (filteredAlerts.length > 0) {
        for (const alert of filteredAlerts) {
          await saveAlert(alert)
        }

        // 로컬 상태 업데이트
        setAlerts(prevAlerts => {
          const updated = [...prevAlerts, ...filteredAlerts]
          // 중복 제거
          const unique = updated.filter((alert, index, self) =>
            index === self.findIndex(a => a.id === alert.id)
          )
          const sorted = sortAlertsByPriority(unique)
          alertsRef.current = sorted // ref 업데이트
          return sorted
        })

        debug(`🚨 ${siteId}/${sensorKey}: ${filteredAlerts.length}개 새 경고 생성`)
      }
    }
  }

  /**
   * 경고를 Firebase에 저장
   */
  const saveAlert = async (alert) => {
    try {
      // 활성 경고에 저장
      const activeAlertRef = ref(database, `alerts/active/${alert.id}`)
      await set(activeAlertRef, alert)

      // 히스토리에 저장
      const historyRef = ref(database, 'alerts/history')
      await push(historyRef, alert)

      debug(`📝 경고 저장: ${alert.id}`)
    } catch (error) {
      logError('경고 저장 오류:', error)
    }
  }

  /**
   * 경고 확인 처리
   */
  const acknowledgeAlert = async (alertId) => {
    try {
      const alertRef = ref(database, `alerts/active/${alertId}`)
      await update(alertRef, {
        acknowledged: true,
        acknowledgedAt: Date.now()
      })

      // 로컬 상태 업데이트
      setAlerts(prevAlerts => {
        const updated = prevAlerts.map(alert =>
          alert.id === alertId
            ? { ...alert, acknowledged: true, acknowledgedAt: Date.now() }
            : alert
        )
        alertsRef.current = updated
        return updated
      })

      debug(`✅ 경고 확인: ${alertId}`)
    } catch (error) {
      logError('경고 확인 오류:', error)
    }
  }

  /**
   * 모든 경고 확인
   */
  const acknowledgeAllAlerts = async () => {
    const activeAlerts = getActiveAlerts(alerts)

    for (const alert of activeAlerts) {
      await acknowledgeAlert(alert.id)
    }
  }

  /**
   * 경고 삭제 (확인된 경고만)
   */
  const deleteAlert = async (alertId) => {
    try {
      const alertRef = ref(database, `alerts/active/${alertId}`)
      await set(alertRef, null)

      setAlerts(prevAlerts => {
        const updated = prevAlerts.filter(alert => alert.id !== alertId)
        alertsRef.current = updated
        return updated
      })

      debug(`🗑️ 경고 삭제: ${alertId}`)
    } catch (error) {
      logError('경고 삭제 오류:', error)
    }
  }

  /**
   * 모든 경고 삭제
   */
  const deleteAllAlerts = async () => {
    try {
      // Firebase에서 모든 활성 경고 삭제
      const activeAlertsRef = ref(database, 'alerts/active')
      await set(activeAlertsRef, null)

      // 로컬 상태 초기화
      setAlerts([])
      alertsRef.current = []

      debug('🗑️ 모든 경고 삭제 완료')
    } catch (error) {
      logError('모든 경고 삭제 오류:', error)
    }
  }

  /**
   * 경고 히스토리 로드
   */
  const loadAlertHistory = async (days = 7) => {
    try {
      const historyRef = ref(database, 'alerts/history')
      const snapshot = await get(historyRef)

      if (snapshot.exists()) {
        const historyData = snapshot.val()
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000)

        const recentHistory = Object.values(historyData)
          .filter(alert => alert.timestamp > cutoffTime)
          .sort((a, b) => b.timestamp - a.timestamp)

        setAlertHistory(recentHistory)
      }
    } catch (error) {
      logError('경고 히스토리 로드 오류:', error)
    }
  }

  /**
   * 센서 데이터 실시간 감지 및 경고 처리
   */
  const setupSensorListeners = async () => {
    try {
      // 현재 사이트 목록 가져오기
      const sitesRef = ref(database, 'sites')
      const sitesSnapshot = await get(sitesRef)

      if (!sitesSnapshot.exists()) return

      const sitesData = sitesSnapshot.val()

      // 각 사이트의 센서 데이터 감지
      Object.entries(sitesData).forEach(([siteId, siteData]) => {
        const sensorsRef = ref(database, `sensors/${siteId}`)

        sensorListenersRef.current[siteId] = onValue(sensorsRef, (snapshot) => {
          if (!snapshot.exists()) return

          const sensorData = snapshot.val()

          // 각 센서별로 경고 처리
          Object.entries(sensorData).forEach(([sensorKey, data]) => {
            if (sensorKey === 'history') return

            // 센서 타입 추출 (ultrasonic_01 -> ultrasonic)
            const sensorType = sensorKey.includes('_')
              ? sensorKey.split('_')[0]
              : sensorKey

            processAlerts(siteId, sensorKey, data, sensorType)
          })
        })
      })

      debug('🔔 센서 경고 감지 시작')
    } catch (error) {
      logError('센서 리스너 설정 오류:', error)
    }
  }

  /**
   * 활성 경고 실시간 감지
   */
  const setupAlertListeners = () => {
    const activeAlertsRef = ref(database, 'alerts/active')

    return onValue(activeAlertsRef, (snapshot) => {
      if (snapshot.exists()) {
        const alertsData = snapshot.val()
        const alertsList = Object.values(alertsData)
        // 중복 제거
        const uniqueAlerts = alertsList.filter((alert, index, self) =>
          index === self.findIndex(a => a.id === alert.id)
        )
        setAlerts(sortAlertsByPriority(uniqueAlerts))
        alertsRef.current = uniqueAlerts
      } else {
        setAlerts([])
        alertsRef.current = []
      }
      setIsLoading(false)
    })
  }

  /**
   * 경고 통계 업데이트
   */
  useEffect(() => {
    const activeAlerts = getActiveAlerts(alerts)
    const counts = getAlertCounts(alerts)

    setAlertStats({
      total: alerts.length,
      active: activeAlerts.length,
      acknowledged: alerts.length - activeAlerts.length,
      byType: counts
    })
  }, [alerts])

  /**
   * 초기화 및 리스너 설정
   */
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)

      // alertsRef 초기화
      alertsRef.current = []

      // 임계값 로드
      await loadThresholds()

      // 경고 히스토리 로드
      await loadAlertHistory()

      // 센서 데이터 감지 설정
      await setupSensorListeners()

      // 활성 경고 감지 설정
      const unsubscribe = setupAlertListeners()

      return unsubscribe
    }

    let unsubscribe
    initialize().then(unsub => {
      unsubscribe = unsub
    })

    // 정리
    return () => {
      if (unsubscribe) unsubscribe()

      // 센서 리스너 정리
      Object.values(sensorListenersRef.current).forEach(listener => {
        if (typeof listener === 'function') listener()
      })
    }
  }, [])

  // 자동 정리 시스템 관리
  const startAutomaticCleanup = () => {
    debug('🚀 스마트 알림 시스템 자동 정리 시작')
    startAutoCleanup(database)
  }

  const stopAutomaticCleanup = () => {
    debug('⏹️ 자동 정리 시스템 중지')
    stopAutoCleanup()
  }

  const manualCleanup = async () => {
    debug('🧹 수동 정리 실행')
    const historyResult = await cleanupAlertHistory(database)
    const cacheResult = cleanupMemoryCache()
    return { historyResult, cacheResult }
  }

  // 개발용: 모든 히스토리 즉시 삭제
  const deleteAllHistory = async () => {
    try {
      debug('🗑️ 모든 알림 히스토리 삭제 시작')

      const historyRef = ref(database, 'alerts/history')
      await set(historyRef, null)

      debug('✅ 모든 히스토리 삭제 완료')
      return { success: true, message: '모든 알림 히스토리가 삭제되었습니다' }
    } catch (error) {
      logError('❌ 히스토리 삭제 오류:', error)
      return { success: false, error: error.message }
    }
  }

  // 개발용: 활성 알림도 모두 삭제
  const deleteAllActiveAlerts = async () => {
    try {
      debug('🗑️ 모든 활성 알림 삭제 시작')

      const activeRef = ref(database, 'alerts/active')
      await set(activeRef, null)

      // 로컬 상태도 초기화
      setAlerts([])
      alertsRef.current = []

      debug('✅ 모든 활성 알림 삭제 완료')
      return { success: true, message: '모든 활성 알림이 삭제되었습니다' }
    } catch (error) {
      logError('❌ 활성 알림 삭제 오류:', error)
      return { success: false, error: error.message }
    }
  }

  // 개발용: 전체 시스템 초기화 (모든 데이터 삭제)
  const resetAllSystemData = async () => {
    try {
      debug('🔥 전체 시스템 초기화 시작')

      // 1. 모든 사이트 삭제
      const sitesRef = ref(database, 'sites')
      await set(sitesRef, null)
      debug('✅ 모든 사이트 데이터 삭제 완료')

      // 2. 모든 센서 데이터 삭제
      const sensorsRef = ref(database, 'sensors')
      await set(sensorsRef, null)
      debug('✅ 모든 센서 데이터 삭제 완료')

      // 3. 모든 경고 삭제
      const alertsRef = ref(database, 'alerts')
      await set(alertsRef, null)
      debug('✅ 모든 경고 데이터 삭제 완료')

      // 4. 모든 설정 삭제
      const settingsRef = ref(database, 'settings')
      await set(settingsRef, null)
      debug('✅ 모든 설정 데이터 삭제 완료')

      // 5. 로컬 상태 초기화
      setAlerts([])
      alertsRef.current = []
      setThresholds({})

      debug('🔥 전체 시스템 초기화 완료')
      return {
        success: true,
        message: '전체 시스템이 초기화되었습니다.',
        deletedData: ['sites', 'sensors', 'alerts', 'settings']
      }
    } catch (error) {
      logError('❌ 시스템 초기화 오류:', error)
      return { success: false, error: error.message }
    }
  }

  // 개발용: 캐시 즉시 초기화
  const clearCache = () => {
    const result = cleanupMemoryCache()
    debug('🧹 캐시 초기화 완료')
    return { success: true, cleared: result }
  }

  const getSystemStatus = () => {
    return {
      cache: getCacheStatus(),
      alerts: {
        total: alerts.length,
        active: getActiveAlerts(alerts).length,
        byLevel: getAlertCounts(alerts)
      }
    }
  }

  return {
    // 상태
    alerts,
    alertHistory,
    thresholds,
    alertStats,
    isLoading,

    // 경고 관리
    acknowledgeAlert,
    acknowledgeAllAlerts,
    deleteAlert,
    deleteAllAlerts,
    processAlerts,

    // 임계값 관리
    saveThresholds,
    loadThresholds,
    loadSiteThresholds,

    // 히스토리 관리
    loadAlertHistory,

    // 실무용 자동 정리 시스템
    startAutomaticCleanup,
    stopAutomaticCleanup,
    manualCleanup,
    getSystemStatus,

    // 개발용 즉시 삭제 도구
    deleteAllHistory,
    deleteAllActiveAlerts,
    resetAllSystemData,
    clearCache,

    // 유틸리티
    activeAlerts: getActiveAlerts(alerts),
    alertsBySite: groupAlertsBySite(alerts),
    alertCounts: getAlertCounts(alerts)
  }
}
