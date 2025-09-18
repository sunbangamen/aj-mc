import { useState, useEffect, useRef } from 'react'
import { ref, set, get, update } from 'firebase/database'
import { database } from '../services/firebase'
import {
  generateSensorData,
  createStatusScenario,
  createGradualChangeSimulator,
  SENSOR_GENERATORS
} from '../utils/sensorSimulator'

/**
 * 센서 데이터 시뮬레이션을 관리하는 커스텀 훅
 */
export const useSensorSimulation = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [simulationConfig, setSimulationConfig] = useState({
    interval: 3000, // 3초마다 업데이트
    mode: 'random', // 'random', 'scenario', 'gradual'
    sites: [], // 시뮬레이션할 사이트 목록
  })
  const [simulationStats, setSimulationStats] = useState({
    totalUpdates: 0,
    lastUpdate: null,
    errors: 0
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
   * 특정 사이트의 센서 데이터 업데이트
   */
  const updateSensorData = async (siteId, sensorType, data) => {
    try {
      // 현재 센서 데이터 업데이트
      const sensorRef = ref(database, `sensors/${siteId}/${sensorType}`)
      // history 보존을 위해 병합 업데이트 사용
      await update(sensorRef, data)

      // 히스토리에 추가
      const historyRef = ref(database, `sensors/${siteId}/${sensorType}/history/${data.timestamp}`)
      await set(historyRef, data)

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

    for (const site of sites) {
      for (const sensorType of site.sensorTypes || ['ultrasonic']) {
        let sensorData

        switch (mode) {
          case 'scenario':
            // 시나리오 기반 시뮬레이션
            if (!simulatorsRef.current[`${site.id}_${sensorType}_scenario`]) {
              simulatorsRef.current[`${site.id}_${sensorType}_scenario`] = createStatusScenario()
            }
            const scenarioStatus = simulatorsRef.current[`${site.id}_${sensorType}_scenario`]()
            sensorData = generateSensorData(sensorType, scenarioStatus)
            break

          case 'gradual':
            // 점진적 변화 시뮬레이션
            if (!simulatorsRef.current[`${site.id}_${sensorType}_gradual`]) {
              simulatorsRef.current[`${site.id}_${sensorType}_gradual`] = createGradualChangeSimulator(sensorType)
            }
            const gradualSimulator = simulatorsRef.current[`${site.id}_${sensorType}_gradual`]
            sensorData = gradualSimulator()
            break

          case 'random':
          default:
            // 랜덤 시뮬레이션
            sensorData = generateSensorData(sensorType)
            break
        }

        await updateSensorData(site.id, sensorType, sensorData)
      }
    }

    // 통계 업데이트
    setSimulationStats(prev => ({
      ...prev,
      totalUpdates: prev.totalUpdates + sites.length,
      lastUpdate: new Date().toLocaleTimeString()
    }))
  }

  /**
   * 시뮬레이션 시작
   */
  const startSimulation = async () => {
    if (isRunning) return

    console.log('🚀 센서 시뮬레이션 시작')

    // 사이트 목록 로드
    const sites = await loadSites()
    if (sites.length === 0) {
      alert('시뮬레이션할 사이트가 없습니다. 먼저 관리자 페이지에서 사이트를 생성해주세요.')
      return
    }

    setIsRunning(true)

    // 즉시 첫 번째 사이클 실행
    await runSimulationCycle()

    // 주기적 실행 설정
    intervalRef.current = setInterval(async () => {
      await runSimulationCycle()
    }, simulationConfig.interval)
  }

  /**
   * 시뮬레이션 중지
   */
  const stopSimulation = () => {
    console.log('⏹️ 센서 시뮬레이션 중지')

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
   * 특정 사이트의 특정 센서를 강제로 특정 상태로 설정
   */
  const forceSensorStatus = async (siteId, sensorType, status) => {
    const sensorData = generateSensorData(sensorType, status)
    await updateSensorData(siteId, sensorType, sensorData)

    console.log(`🎯 강제 설정: ${siteId}/${sensorType} → ${status}`)
  }

  /**
   * 모든 센서를 특정 상태로 설정 (데모용)
   */
  const setAllSensorsStatus = async (status) => {
    const { sites } = simulationConfig

    for (const site of sites) {
      for (const sensorType of site.sensorTypes || ['ultrasonic']) {
        await forceSensorStatus(site.id, sensorType, status)
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
   * 사이트 목록 초기 로드
   */
  useEffect(() => {
    loadSites()
  }, [])

  return {
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
}
