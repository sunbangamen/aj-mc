import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { ref, set, get, onValue, update } from 'firebase/database'
import { database } from '../services/firebase'
import {
  generateSensorData,
  createStatusScenario,
  createGradualChangeSimulator,
} from '../utils/sensorSimulator'

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
    interval: 3000, // 3초마다 업데이트
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
      console.error('사이트 목록 로드 오류:', error)
      return []
    }
  }

  /**
   * 특정 사이트의 센서 데이터 업데이트 (다중 센서 지원)
   */
  const updateSensorData = async (siteId, sensorType, sensorNumber, data) => {
    try {
      // 센서 키 생성 (예: ultrasonic_01, temperature_01)
      const sensorKey = sensorNumber ? `${sensorType}_${sensorNumber.toString().padStart(2, '0')}` : sensorType

      // 현재 센서 데이터 업데이트
      const sensorRef = ref(database, `sensors/${siteId}/${sensorKey}`)
      // set으로 부모 노드를 덮어쓰면 history가 매 주기 삭제되므로 update로 병합
      await update(sensorRef, data)
      console.log(`✅ 현재 데이터 저장: sensors/${siteId}/${sensorKey}`, data)

      // 센서별 히스토리에 추가
      const historyPath = `sensors/${siteId}/${sensorKey}/history/${data.timestamp}`
      const historyRef = ref(database, historyPath)
      await set(historyRef, data)
      console.log(`📚 히스토리 저장: ${historyPath}`, data)

      return true
    } catch (error) {
      console.error('센서 데이터 업데이트 오류:', error)
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
      console.log('시뮬레이션할 사이트가 없습니다.')
      return
    }

    // 처리시간 측정 시작
    const startTime = performance.now()

    for (const site of sites) {
      // 현장별 센서 타입과 개수 확인
      const sensorTypes = site.sensorTypes || ['ultrasonic']
      const totalSensorCount = site.sensorCount || 1

      console.log(`🎯 시뮬레이션 처리 중: ${site.id}`)
      console.log(`📊 센서 타입: [${sensorTypes.join(', ')}]`)
      console.log(`🔢 센서 개수: ${totalSensorCount}`)

      // 단일 센서 타입의 경우 전체 개수 사용, 다중 타입의 경우 균등 분배
      const sensorsPerType = sensorTypes.length === 1
        ? totalSensorCount
        : Math.max(1, Math.floor(totalSensorCount / sensorTypes.length))

      for (const sensorType of sensorTypes) {
        // 각 센서 타입별로 sensorsPerType만큼 생성
        for (let sensorNum = 1; sensorNum <= sensorsPerType; sensorNum++) {
          const simulatorKey = `${site.id}_${sensorType}_${sensorNum.toString().padStart(2, '0')}`
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
          sensorData.location = `${sensorType} ${sensorNum}번`
          sensorData.deviceId = `SIM_${site.id.slice(-4)}_${sensorType.slice(0, 3).toUpperCase()}_${sensorNum.toString().padStart(2, '0')}`

          await updateSensorData(site.id, sensorType, sensorNum, sensorData)
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
        totalUpdates: prev.totalUpdates + sites.length,
        lastUpdate: new Date().toLocaleTimeString(),
        processingTimes: newProcessingTimes,
        averageProcessingTime: Math.round(averageProcessingTime * 100) / 100 // 소수점 2자리
      }
    })

    console.log(`⚡ 시뮬레이션 사이클 완료: ${Math.round(processingTime)}ms`)
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

      console.log(`🧹 ${siteId}: 기존 단일 센서 키 정리 완료`)
    } catch (error) {
      console.error('기존 센서 키 정리 오류:', error)
    }
  }

  /**
   * 시뮬레이션 시작
   */
  const startSimulation = async () => {
    if (isRunning) return

    console.log('🚀 전역 센서 시뮬레이션 시작')

    // 현재 사이트 목록 확인
    if (simulationConfig.sites.length === 0) {
      alert('시뮬레이션할 사이트가 없습니다. 먼저 관리자 페이지에서 사이트를 생성해주세요.')
      return false
    }

    console.log(`🎯 시뮬레이션 대상: ${simulationConfig.sites.length}개 사이트`)

    // 모든 사이트의 기존 단일 센서 키 정리
    for (const site of simulationConfig.sites) {
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
    console.log('⏹️ 전역 센서 시뮬레이션 중지')

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
    console.log(`🎯 강제 설정: ${siteId}/${sensorKey} → ${status}`)
  }

  /**
   * 모든 센서를 특정 상태로 설정 (데모용, 다중 센서 지원)
   */
  const setAllSensorsStatus = async (status) => {
    const { sites } = simulationConfig

    for (const site of sites) {
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
    console.log('🔥 사이트 목록 실시간 감지 시작')

    const sitesRef = ref(database, 'sites')

    const unsubscribe = onValue(sitesRef, (snapshot) => {
      try {
        const sitesData = snapshot.val()
        console.log('📥 사이트 목록 업데이트:', sitesData)

        if (sitesData) {
          const sitesList = Object.entries(sitesData).map(([id, data]) => ({
            id,
            ...data
          }))

          console.log(`🏢 감지된 사이트: ${sitesList.length}개`, sitesList)

          setSimulationConfig(prev => {
            console.log(`📊 이전 사이트 수: ${prev.sites.length}개`)
            console.log(`📊 새 사이트 수: ${sitesList.length}개`)

            // 강제 리렌더링을 위해 완전히 새로운 객체 생성
            const newConfig = {
              interval: prev.interval,
              mode: prev.mode,
              sites: [...sitesList] // 새 배열 생성
            }

            console.log('📊 새 설정 객체 생성:', newConfig)
            return newConfig
          })
        } else {
          console.log('📊 사이트 데이터 없음 - 빈 배열로 설정')
          setSimulationConfig(prev => ({
            interval: prev.interval,
            mode: prev.mode,
            sites: [] // 새 빈 배열
          }))
        }
      } catch (error) {
        console.error('❌ 사이트 목록 실시간 업데이트 오류:', error)
      }
    })

    return () => {
      console.log('🔥 사이트 목록 실시간 감지 중지')
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
