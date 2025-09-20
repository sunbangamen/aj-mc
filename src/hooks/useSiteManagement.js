import { useState, useEffect } from 'react'
import {
  ref,
  onValue,
  off,
  set,
  update,
  remove,
  query,
  orderByChild
} from 'firebase/database'
import { database } from '../services/firebase'
import {
  isValidSiteData,
  generateSiteId,
  DEFAULT_SITE_TEMPLATE
} from '../types/site'

/**
 * 모든 사이트 데이터를 관리하는 훅
 * @returns {Object} { sites, loading, error, connectionStatus }
 */
export const useSites = () => {
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  useEffect(() => {
    console.log('🔥 useSites 훅 시작')

    // Firebase 사이트 참조 생성
    const sitesRef = ref(database, 'sites')
    const sitesQuery = query(sitesRef, orderByChild('name'))

    console.log('📍 Firebase 사이트 참조 경로: sites')

    // 실시간 리스너 설정
    const unsubscribe = onValue(
      sitesQuery,
      snapshot => {
        try {
          console.log('📥 Firebase 사이트 데이터 수신')
          setConnectionStatus('connected')

          const firebaseData = snapshot.val()
          console.log('📊 수신된 사이트 데이터:', firebaseData)

          if (firebaseData) {
            // 객체를 배열로 변환
            const sitesArray = Object.entries(firebaseData)
              .map(([siteId, siteData]) => ({
                id: siteId,
                ...siteData,
              }))
              .filter(isValidSiteData) // 유효한 데이터만 필터링

            setSites(sitesArray)
            setError(null)
          } else {
            console.log('⚠️ 사이트 데이터가 없음')
            setSites([])
            setError(null)
          }
        } catch (err) {
          console.error('❌ 사이트 데이터 처리 오류:', err)
          setError(`사이트 데이터 처리 오류: ${err.message}`)
          setConnectionStatus('error')
        } finally {
          setLoading(false)
        }
      },
      err => {
        console.error('❌ Firebase 사이트 연결 오류:', err)
        setError(`Firebase 사이트 연결 오류: ${err.message}`)
        setConnectionStatus('error')
        setLoading(false)
      }
    )

    // 정리 함수
    return () => {
      console.log('🔥 useSites 훅 정리')
      unsubscribe()
    }
  }, [])

  return {
    sites,
    loading,
    error,
    connectionStatus,
  }
}

/**
 * 특정 사이트 데이터를 가져오는 훅
 * @param {string} siteId - 사이트 ID
 * @returns {Object} { site, loading, error, connectionStatus }
 */
export const useSite = (siteId) => {
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  useEffect(() => {
    if (!siteId) {
      setError('Site ID가 필요합니다.')
      setLoading(false)
      return
    }

    console.log(`🔥 useSite 훅 시작: ${siteId}`)

    // Firebase 특정 사이트 참조 생성
    const siteRef = ref(database, `sites/${siteId}`)

    console.log('📍 Firebase 사이트 참조 경로:', `sites/${siteId}`)

    // 실시간 리스너 설정
    const unsubscribe = onValue(
      siteRef,
      snapshot => {
        try {
          console.log('📥 Firebase 사이트 데이터 수신')
          setConnectionStatus('connected')

          const firebaseData = snapshot.val()
          console.log('📊 수신된 사이트 데이터:', firebaseData)

          if (firebaseData && isValidSiteData({ id: siteId, ...firebaseData })) {
            setSite({ id: siteId, ...firebaseData })
            setError(null)
          } else {
            console.log('⚠️ 사이트 데이터가 없거나 유효하지 않음')
            setSite(null)
            setError('사이트를 찾을 수 없습니다.')
          }
        } catch (err) {
          console.error('❌ 사이트 데이터 처리 오류:', err)
          setError(`사이트 데이터 처리 오류: ${err.message}`)
          setConnectionStatus('error')
        } finally {
          setLoading(false)
        }
      },
      err => {
        console.error('❌ Firebase 사이트 연결 오류:', err)
        setError(`Firebase 사이트 연결 오류: ${err.message}`)
        setConnectionStatus('error')
        setLoading(false)
      }
    )

    // 정리 함수
    return () => {
      console.log('🔥 useSite 훅 정리')
      unsubscribe()
    }
  }, [siteId])

  return {
    site,
    loading,
    error,
    connectionStatus,
  }
}

/**
 * 사이트 관리 기능을 제공하는 훅
 * @returns {Object} CRUD 함수들
 */
export const useSiteManagement = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // 사이트 생성
  const createSite = async (siteData) => {
    setIsLoading(true)
    setError(null)

    try {
      const now = Date.now()
      const siteId = generateSiteId()

      const newSite = {
        ...DEFAULT_SITE_TEMPLATE,
        ...siteData,
        id: siteId,
        createdAt: now,
        updatedAt: now,
      }

      console.log('📝 사이트 생성 시도:', newSite)

      // Firebase에 사이트 정보 저장
      const siteRef = ref(database, `sites/${siteId}`)
      await set(siteRef, newSite)

      // 센서 설정에 따른 센서 데이터 생성
      const sensorConfig = siteData.sensorConfig || {}
      const sensorCreationPromises = []

      // 각 센서 타입별로 설정된 개수만큼 센서 데이터 생성
      Object.entries(sensorConfig).forEach(([sensorType, count]) => {
        if (count > 0) {
          for (let i = 1; i <= count; i++) {
            // 항상 일관되게 번호 붙이기 (1개여도 _1)
            const sensorPath = `sensors/${siteId}/${sensorType}_${i}`

            let defaultSensorData = {
              status: 'normal',
              timestamp: now,
              lastUpdate: now,
              // 기본 하드웨어 메타데이터
              deviceId: `${sensorType.toUpperCase()}_${siteId.slice(-6)}_${i}`,
              location: `${sensorType} 센서 ${i}번`,
              batteryLevel: 95 + Math.floor(Math.random() * 5), // 95-99%
              signalStrength: -40 - Math.floor(Math.random() * 20), // -40 ~ -60 dBm
              firmwareVersion: 'v1.0.0',
              accuracy: 95,
              reliability: 'high',
              errorCount: 0,
              consecutiveErrors: 0,
              installDate: now,
              lastMaintenance: now,
              calibrationDate: now
            }

            // 센서 타입별 기본 데이터 및 하드웨어 모델 설정
            switch (sensorType) {
              case 'ultrasonic':
                defaultSensorData.distance = 50 + Math.random() * 100
                defaultSensorData.hardwareModel = 'HC-SR04'
                break
              case 'temperature':
                defaultSensorData.temperature = 20 + Math.random() * 15
                defaultSensorData.hardwareModel = 'DS18B20'
                break
              case 'humidity':
                defaultSensorData.humidity = 40 + Math.random() * 40
                defaultSensorData.hardwareModel = 'DHT22'
                break
              case 'pressure':
                defaultSensorData.pressure = 1000 + Math.random() * 50
                defaultSensorData.hardwareModel = 'BMP280'
                break
              default:
                defaultSensorData.value = 0
                defaultSensorData.hardwareModel = 'Generic'
            }

            const sensorRef = ref(database, sensorPath)
            sensorCreationPromises.push(set(sensorRef, defaultSensorData))
          }
        }
      })

      // 센서 데이터가 없으면 기본 ultrasonic 센서 하나 생성
      if (sensorCreationPromises.length === 0) {
        const defaultSensorRef = ref(database, `sensors/${siteId}/ultrasonic_1`)
        const defaultSensorData = {
          distance: 50,
          status: 'normal',
          timestamp: now,
          lastUpdate: now,
          // 기본 하드웨어 메타데이터
          deviceId: `ULTRASONIC_${siteId.slice(-6)}_1`,
          location: 'ultrasonic 센서 1번',
          batteryLevel: 98,
          signalStrength: -45,
          firmwareVersion: 'v1.0.0',
          hardwareModel: 'HC-SR04',
          accuracy: 95,
          reliability: 'high',
          errorCount: 0,
          consecutiveErrors: 0,
          installDate: now,
          lastMaintenance: now,
          calibrationDate: now
        }
        sensorCreationPromises.push(set(defaultSensorRef, defaultSensorData))
      }

      // 모든 센서 데이터 생성 완료까지 대기
      await Promise.all(sensorCreationPromises)

      console.log('✅ 사이트 및 센서 데이터 생성 완료:', siteId)
      return { success: true, siteId, site: newSite }
    } catch (err) {
      console.error('❌ 사이트 생성 오류:', err)
      setError(`사이트 생성 실패: ${err.message}`)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  // 사이트 수정
  const updateSite = async (siteId, updates) => {
    setIsLoading(true)
    setError(null)

    try {
      const now = Date.now()
      const updateData = {
        ...updates,
        updatedAt: now,
      }

      console.log('📝 사이트 수정 시도:', siteId, updateData)

      // Firebase에서 업데이트
      const siteRef = ref(database, `sites/${siteId}`)
      await update(siteRef, updateData)

      console.log('✅ 사이트 수정 완료:', siteId)
      return { success: true, siteId }
    } catch (err) {
      console.error('❌ 사이트 수정 오류:', err)
      setError(`사이트 수정 실패: ${err.message}`)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  // 사이트 삭제
  const deleteSite = async (siteId) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🗑️ 사이트 삭제 시도:', siteId)

      // Firebase에서 사이트 정보 삭제
      const siteRef = ref(database, `sites/${siteId}`)
      await remove(siteRef)

      // Firebase에서 센서 데이터도 삭제
      const sensorRef = ref(database, `sensors/${siteId}`)
      await remove(sensorRef)

      console.log('✅ 사이트 및 센서 데이터 삭제 완료:', siteId)
      return { success: true, siteId }
    } catch (err) {
      console.error('❌ 사이트 삭제 오류:', err)
      setError(`사이트 삭제 실패: ${err.message}`)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  // 사이트 상태 변경
  const updateSiteStatus = async (siteId, status) => {
    return await updateSite(siteId, { status })
  }

  return {
    createSite,
    updateSite,
    deleteSite,
    updateSiteStatus,
    isLoading,
    error,
  }
}