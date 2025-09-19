import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { ref, set, get, onValue, update } from 'firebase/database'
import { database } from '../services/firebase'
import {
  generateSensorData,
  createStatusScenario,
  createGradualChangeSimulator,
} from '../utils/sensorSimulator'
import { debug, error as logError } from '../utils/log'

const SimulationContext = createContext()

export const useSimulation = () => {
  const context = useContext(SimulationContext)
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider')
  }
  return context
}

export const SimulationProvider = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [simulationConfig, setSimulationConfig] = useState({
    interval: 3000, // 3초마다 업데이트 (요청 반영)
    mode: 'random', // 'random', 'scenario', 'gradual'
    sites: [], // 시뮬레이션할 사이트 목록
  })
  const [simulationStats, setSimulationStats] = useState({
    totalUpdates: 0,
    lastUpdate: null,
    errors: 0,
    processingTimes: [], // 최근 처리시간들 저장
    averageProcessingTime: 0
  })

  const intervalRef = useRef(null)
  const simulatorsRef = useRef({}) // 사이트별 시뮬레이터 저장

  /**
   * 사이트 목록을 가져와서 시뮬레이션 대상 설정
   */
  const loadSites = async () => {
    try {
      const sitesRef = ref(database, 'sites')
      const snapshot = await get(sitesRef)
      const sitesData = snapshot.val()

      if (sitesData) {
        const sitesList = Object.entries(sitesData).map(([id, data]) => ({
          id,
          ...data
        }))
        setSimulationConfig(prev => ({
          ...prev,
          sites: sitesList
        }))
        return sitesList
      }
      return []
    } catch (error) {
      logError('사이트 목록 로드 오류:', error)
      return []
    }
  }

  /**
   * 특정 사이트의 센서 데이터 업데이트 (다중 센서 지원)
   */
  const updateSensorData = async (siteId, sensorType, sensorNumber, data) => {
    try {
      // 센서 키 생성 - 새로운 형식에 맞게 수정 (예: ultrasonic_1, temperature_1)
      const sensorKey = sensorNumber ? `${sensorType}_${sensorNumber}` : sensorType

      // 현재 센서 데이터 업데이트
      const sensorRef = ref(database, `sensors/${siteId}/${sensorKey}`)
      // set으로 부모 노드를 덮어쓰면 history가 매 주기 삭제되므로 update로 병합
      await update(sensorRef, data)

      // 센서별 히스토리에 추가
      const historyPath = `sensors/${siteId}/${sensorKey}/history/${data.timestamp}`
      const historyRef = ref(database, historyPath)
      await set(historyRef, data)

      return true
    } catch (error) {
      logError('센서 데이터 업데이트 오류:', error)
      setSimulationStats(prev => ({
        ...prev,
        errors: prev.errors + 1
      }))
      return false
    }
  }

  /**
   * 모든 사이트의 센서 데이터 시뮬레이션 실행
   */
  const runSimulationCycle = async () => {
    const { sites, mode } = simulationConfig

    if (sites.length === 0) {
      debug('시뮬레이션할 사이트가 없습니다.')
      return
    }

    // 활성 사이트만 대상으로 실행
    const activeSites = sites.filter(s => s.status === 'active')
    if (activeSites.length === 0) {
      debug('활성 상태의 사이트가 없어 시뮬레이션을 건너뜁니다')
      return
    }

    // 처리시간 측정 시작
    const startTime = performance.now()

    for (const site of activeSites) {
      // 새로운 sensorConfig 구조 우선 사용, 없으면 구형식 사용
      const sensorConfig = site.sensorConfig || {}
      const hasNewConfig = Object.keys(sensorConfig).length > 0

      if (hasNewConfig) {
        // 새로운 구조: sensorConfig 사용
        for (const [sensorType, count] of Object.entries(sensorConfig)) {
          if (count > 0) {
            for (let sensorNum = 1; sensorNum <= count; sensorNum++) {
              const simulatorKey = `${site.id}_${sensorType}_${sensorNum}`
              let sensorData

              switch (mode) {
                case 'scenario':
                  // 시나리오 기반 시뮬레이션
                  if (!simulatorsRef.current[`${simulatorKey}_scenario`]) {
                    simulatorsRef.current[`${simulatorKey}_scenario`] = createStatusScenario()
                  }
                  const scenarioStatus = simulatorsRef.current[`${simulatorKey}_scenario`]()
                  sensorData = generateSensorData(sensorType, scenarioStatus)
                  break

                case 'gradual':
                  // 점진적 변화 시뮬레이션
                  if (!simulatorsRef.current[`${simulatorKey}_gradual`]) {
                    simulatorsRef.current[`${simulatorKey}_gradual`] = createGradualChangeSimulator(sensorType)
                  }
                  const gradualSimulator = simulatorsRef.current[`${simulatorKey}_gradual`]
                  sensorData = gradualSimulator()
                  break

                case 'random':
                default:
                  // 랜덤 시뮬레이션
                  sensorData = generateSensorData(sensorType)
                  break
              }

              // 센서별 위치 정보 추가 (시뮬레이션용)
              sensorData.location = `${sensorType} 센서 ${sensorNum}번`
              sensorData.deviceId = `SIM_${site.id.slice(-4)}_${sensorType.slice(0, 3).toUpperCase()}_${sensorNum}`

              await updateSensorData(site.id, sensorType, sensorNum, sensorData)
            }
          }
        }
      } else {
        // 구형식 지원 (하위 호환성)
        const sensorTypes = site.sensorTypes || ['ultrasonic']
        const totalSensorCount = site.sensorCount || 1

        const sensorsPerType = sensorTypes.length === 1
          ? totalSensorCount
          : Math.max(1, Math.floor(totalSensorCount / sensorTypes.length))

        for (const sensorType of sensorTypes) {
          for (let sensorNum = 1; sensorNum <= sensorsPerType; sensorNum++) {
            const simulatorKey = `${site.id}_${sensorType}_${sensorNum}`
            let sensorData

            switch (mode) {
              case 'scenario':
                if (!simulatorsRef.current[`${simulatorKey}_scenario`]) {
                  simulatorsRef.current[`${simulatorKey}_scenario`] = createStatusScenario()
                }
                const scenarioStatus = simulatorsRef.current[`${simulatorKey}_scenario`]()
                sensorData = generateSensorData(sensorType, scenarioStatus)
                break

              case 'gradual':
                if (!simulatorsRef.current[`${simulatorKey}_gradual`]) {
                  simulatorsRef.current[`${simulatorKey}_gradual`] = createGradualChangeSimulator(sensorType)
                }
                const gradualSimulator = simulatorsRef.current[`${simulatorKey}_gradual`]
                sensorData = gradualSimulator()
                break

              case 'random':
              default:
                sensorData = generateSensorData(sensorType)
                break
            }

            sensorData.location = `${sensorType} 센서 ${sensorNum}번`
            sensorData.deviceId = `SIM_${site.id.slice(-4)}_${sensorType.slice(0, 3).toUpperCase()}_${sensorNum}`

            await updateSensorData(site.id, sensorType, sensorNum, sensorData)
          }
        }
      }
    }

    // 처리시간 측정 완료
    const endTime = performance.now()
    const processingTime = endTime - startTime

    // 통계 업데이트 (처리시간 포함)
    setSimulationStats(prev => {
      const newProcessingTimes = [...prev.processingTimes, processingTime]
      // 최근 20개 처리시간만 유지
      if (newProcessingTimes.length > 20) {
        newProcessingTimes.shift()
      }

      // 평균 처리시간 계산
      const averageProcessingTime = newProcessingTimes.reduce((sum, time) => sum + time, 0) / newProcessingTimes.length

      return {
        ...prev,
        totalUpdates: prev.totalUpdates + activeSites.length,
        lastUpdate: new Date().toLocaleTimeString(),
        processingTimes: newProcessingTimes,
        averageProcessingTime: Math.round(averageProcessingTime * 100) / 100 // 소수점 2자리
      }
    })

    // 성능 모니터링 로그는 필요할 때만 출력
    if (processingTime > 100) {
      debug(`⚡ 시뮬레이션 사이클 완료: ${Math.round(processingTime)}ms`)
    }
  }

  /**
   * 기존 단일 센서 키 정리 (다중 센서 전환 시)
   */
  const cleanupLegacySensorKeys = async (siteId) => {
    try {
      // 기존 ultrasonic, temperature 등 단일 키 삭제
      const legacyKeys = ['ultrasonic', 'temperature', 'humidity', 'pressure']

      for (const key of legacyKeys) {
        const legacyRef = ref(database, `sensors/${siteId}/${key}`)
        await set(legacyRef, null)
      }

      debug(`🧹 ${siteId}: 기존 단일 센서 키 정리 완료`)
    } catch (error) {
      logError('기존 센서 키 정리 오류:', error)
    }
  }

  /**
   * 시뮬레이션 시작
   */
  const startSimulation = async () => {
    if (isRunning) return

    debug('🚀 전역 센서 시뮬레이션 시작')

    // 현재 사이트 목록 확인
    if (simulationConfig.sites.length === 0) {
      alert('시뮬레이션할 사이트가 없습니다. 먼저 관리자 페이지에서 사이트를 생성해주세요.')
      return false
    }

    debug(`🎯 시뮬레이션 대상: ${simulationConfig.sites.length}개 사이트`)

    // 모든 사이트의 기존 단일 센서 키 정리
    for (const site of simulationConfig.sites.filter(s => s.status === 'active')) {
      await cleanupLegacySensorKeys(site.id)
    }

    setIsRunning(true)

    // 즉시 첫 번째 사이클 실행
    await runSimulationCycle()

    // 주기적 실행 설정
    intervalRef.current = setInterval(async () => {
      await runSimulationCycle()
    }, simulationConfig.interval)

    return true
  }

  /**
   * 시뮬레이션 중지
   */
  const stopSimulation = () => {
    debug('⏹️ 전역 센서 시뮬레이션 중지')

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsRunning(false)

    // 시뮬레이터 초기화
    simulatorsRef.current = {}
  }

  /**
   * 시뮬레이션 설정 변경
   */
  const updateConfig = (newConfig) => {
    setSimulationConfig(prev => ({
      ...prev,
      ...newConfig
    }))

    // 실행 중이면 재시작
    if (isRunning) {
      stopSimulation()
      setTimeout(() => {
        startSimulation()
      }, 100)
    }
  }

  /**
   * 특정 사이트의 특정 센서를 강제로 특정 상태로 설정 (다중 센서 지원)
   */
  const forceSensorStatus = async (siteId, sensorType, sensorNumber, status) => {
    const sensorData = generateSensorData(sensorType, status)

    // 센서 정보 추가
    sensorData.location = `${sensorType} ${sensorNumber}번`
    sensorData.deviceId = `SIM_${siteId.slice(-4)}_${sensorType.slice(0, 3).toUpperCase()}_${sensorNumber.toString().padStart(2, '0')}`

    await updateSensorData(siteId, sensorType, sensorNumber, sensorData)

    const sensorKey = `${sensorType}_${sensorNumber.toString().padStart(2, '0')}`
    debug(`🎯 강제 설정: ${siteId}/${sensorKey} → ${status}`)
  }

  /**
   * 모든 센서를 특정 상태로 설정 (데모용, 다중 센서 지원)
   */
  const setAllSensorsStatus = async (status) => {
    const { sites } = simulationConfig

    for (const site of sites.filter(s => s.status === 'active')) {
      const sensorTypes = site.sensorTypes || ['ultrasonic']
      const totalSensorCount = site.sensorCount || 1
      const sensorsPerType = sensorTypes.length === 1
        ? totalSensorCount
        : Math.max(1, Math.floor(totalSensorCount / sensorTypes.length))

      for (const sensorType of sensorTypes) {
        for (let sensorNum = 1; sensorNum <= sensorsPerType; sensorNum++) {
          await forceSensorStatus(site.id, sensorType, sensorNum, status)
        }
      }
    }
  }

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  /**
   * 사이트 목록 실시간 감지
   */
  useEffect(() => {
    debug('🔥 사이트 목록 실시간 감지 시작')

    const sitesRef = ref(database, 'sites')

    const unsubscribe = onValue(sitesRef, (snapshot) => {
      try {
        const sitesData = snapshot.val()
        debug('📥 사이트 목록 업데이트 수신')

        if (sitesData) {
          const sitesList = Object.entries(sitesData).map(([id, data]) => ({
            id,
            ...data
          }))

          debug(`🏢 감지된 사이트: ${sitesList.length}개`)

          setSimulationConfig(prev => ({
            interval: prev.interval,
            mode: prev.mode,
            sites: [...sitesList]
          }))
        } else {
          debug('📊 사이트 데이터 없음 - 빈 배열로 설정')
          setSimulationConfig(prev => ({
            interval: prev.interval,
            mode: prev.mode,
            sites: [] // 새 빈 배열
          }))
        }
      } catch (error) {
        logError('❌ 사이트 목록 실시간 업데이트 오류:', error)
      }
    })

    return () => {
      debug('🔥 사이트 목록 실시간 감지 중지')
      unsubscribe()
    }
  }, [])

  const value = {
    // 상태
    isRunning,
    simulationConfig,
    simulationStats,

    // 함수
    startSimulation,
    stopSimulation,
    updateConfig,
    forceSensorStatus,
    setAllSensorsStatus,
    loadSites,

    // 유틸리티
    availableModes: [
      { value: 'random', label: '랜덤 시뮬레이션' },
      { value: 'scenario', label: '시나리오 기반' },
      { value: 'gradual', label: '점진적 변화' }
    ],
    availableStatuses: ['normal', 'warning', 'alert', 'offline']
  }

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  )
}
