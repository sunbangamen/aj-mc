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
    mode: 'gradual', // 기본을 점진적 모드로 변경
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
      // 센서 키 생성 - 일관된 패딩 형식 사용 (예: ultrasonic_01, temperature_01)
      const sensorKey = sensorNumber ? `${sensorType}_${sensorNumber.toString().padStart(2, '0')}` : sensorType

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
                case 'gentle':
                  // 아주 미미한 변화 (±1 단위)
                  if (!simulatorsRef.current[`${simulatorKey}_gradual`]) {
                    simulatorsRef.current[`${simulatorKey}_gradual`] = createGradualChangeSimulator(sensorType)
                  }
                  const gentleSimulator = simulatorsRef.current[`${simulatorKey}_gradual`]
                  sensorData = gentleSimulator(1)
                  break

                case 'random':
                default:
                  // 랜덤 시뮬레이션 (위치 정보 포함)
                  sensorData = generateSensorData(sensorType, null, sensorNum, true)
                  break
              }

              // 시뮬레이션용 디바이스 ID 추가
              if (!sensorData.deviceId) {
                sensorData.deviceId = `SIM_${site.id.slice(-4)}_${sensorType.slice(0, 3).toUpperCase()}_${sensorNum}`
              }

              await updateSensorData(site.id, sensorType, sensorNum, sensorData)
            }
          }
        }
      } else {
        // 구형식: sensorConfig가 없으면 실제 DB 센서 키를 사용하여 업데이트 시도
        const sensorsRef = ref(database, `sensors/${site.id}`)
        const sensorsSnap = await get(sensorsRef)

        if (sensorsSnap.exists()) {
          const sensors = sensorsSnap.val() || {}
          const keys = Object.keys(sensors).filter(k => k !== 'history')

          for (const key of keys) {
            const [sensorType, numPart] = key.split('_')
            const sensorNum = parseInt(numPart, 10) || 1
            const simulatorKey = `${site.id}_${sensorType}_${sensorNum}`

            let sensorData
            switch (mode) {
              case 'scenario': {
                if (!simulatorsRef.current[`${simulatorKey}_scenario`]) {
                  simulatorsRef.current[`${simulatorKey}_scenario`] = createStatusScenario()
                }
                const scenarioStatus = simulatorsRef.current[`${simulatorKey}_scenario`]()
                sensorData = generateSensorData(sensorType, scenarioStatus)
                break
              }
              case 'gradual': {
                if (!simulatorsRef.current[`${simulatorKey}_gradual`]) {
                  simulatorsRef.current[`${simulatorKey}_gradual`] = createGradualChangeSimulator(sensorType)
                }
                const gradualSimulator = simulatorsRef.current[`${simulatorKey}_gradual`]
                sensorData = gradualSimulator()
                break
              }
              case 'gentle': {
                if (!simulatorsRef.current[`${simulatorKey}_gradual`]) {
                  simulatorsRef.current[`${simulatorKey}_gradual`] = createGradualChangeSimulator(sensorType)
                }
                const gentleSimulator = simulatorsRef.current[`${simulatorKey}_gradual`]
                sensorData = gentleSimulator(1)
                break
              }
              case 'random':
              default:
                sensorData = generateSensorData(sensorType)
                break
            }

            sensorData.location = `${sensorType} 센서 ${sensorNum}번`
            sensorData.deviceId = `SIM_${site.id.slice(-4)}_${sensorType.slice(0, 3).toUpperCase()}_${sensorNum}`

            await updateSensorData(site.id, sensorType, sensorNum, sensorData)
          }
        } else {
          // 최후 수단: 사이트 메타 정보 활용
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
                case 'gentle':
                  if (!simulatorsRef.current[`${simulatorKey}_gradual`]) {
                    simulatorsRef.current[`${simulatorKey}_gradual`] = createGradualChangeSimulator(sensorType)
                  }
                  const gentleSimulator = simulatorsRef.current[`${simulatorKey}_gradual`]
                  sensorData = gentleSimulator(1)
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
   * 기존 센서 키 정리 (다중 센서 전환 시 + 중복 키 제거)
   */
  const cleanupLegacySensorKeys = async (siteId) => {
    try {
      // 현재 센서 데이터 확인
      const siteRef = ref(database, `sensors/${siteId}`)
      const snapshot = await get(siteRef)
      const currentData = snapshot.val()

      if (!currentData) {
        debug(`🧹 ${siteId}: 센서 데이터 없음 - 정리 건너뜀`)
        return
      }

      const keysToDelete = []

      // 1. 기존 단일 키 삭제
      const legacyKeys = ['ultrasonic', 'temperature', 'humidity', 'pressure']
      legacyKeys.forEach(key => {
        if (currentData[key]) {
          keysToDelete.push(key)
        }
      })

      // 2. 패딩 없는 다중 센서 키 삭제 (패딩 있는 키가 있는 경우)
      Object.keys(currentData).forEach(key => {
        if (key.includes('_') && !key.includes('_0')) { // _01, _02가 아닌 _1, _2 형태
          const [sensorType, sensorNum] = key.split('_')
          const paddedKey = `${sensorType}_${sensorNum.padStart(2, '0')}`

          // 패딩된 키가 존재하면 패딩 없는 키 삭제
          if (currentData[paddedKey]) {
            keysToDelete.push(key)
          }
        }
      })

      // 삭제 실행
      for (const key of keysToDelete) {
        const keyRef = ref(database, `sensors/${siteId}/${key}`)
        await set(keyRef, null)
        debug(`🗑️ ${siteId}: 중복/레거시 키 삭제 - ${key}`)
      }

      debug(`🧹 ${siteId}: 센서 키 정리 완료 (${keysToDelete.length}개 삭제)`)
    } catch (error) {
      logError('센서 키 정리 오류:', error)
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

    // 활성 사이트의 기존 단일 센서 키 정리
    for (const site of simulationConfig.sites.filter(s => s.status === 'active')) {
      await cleanupLegacySensorKeys(site.id)
    }

    // 비활성 및 점검중 현장의 센서를 오프라인으로 설정
    const inactiveSites = simulationConfig.sites.filter(s => s.status !== 'active')
    for (const site of inactiveSites) {
      debug(`🔴 ${site.name} (${site.status}) 현장 센서를 오프라인으로 설정`)

      const sensorTypes = site.sensorTypes || ['ultrasonic']
      const totalSensorCount = site.sensorCount || 1
      const sensorsPerType = sensorTypes.length === 1 ? totalSensorCount : Math.max(1, Math.floor(totalSensorCount / sensorTypes.length))

      for (const sensorType of sensorTypes) {
        const sensorCount = sensorTypes.length === 1 ? totalSensorCount : sensorsPerType

        for (let sensorNum = 1; sensorNum <= sensorCount; sensorNum++) {
          const sensorKey = `${sensorType}_${sensorNum.toString().padStart(2, '0')}`
          const sensorRef = ref(database, `sensors/${site.id}/${sensorKey}`)

          // 오프라인 상태로 설정
          await set(sensorRef, {
            status: 'offline',
            timestamp: Date.now(),
            [sensorType]: null
          })
        }
      }
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
  const stopSimulation = async () => {
    debug('⏹️ 전역 센서 시뮬레이션 중지')

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsRunning(false)

    // 비활성 및 점검중 현장의 센서를 오프라인으로 설정
    try {
      const { sites } = simulationConfig
      const inactiveSites = sites.filter(s => s.status !== 'active')

      for (const site of inactiveSites) {
        debug(`🔴 ${site.name} (${site.status}) 현장 센서를 오프라인으로 설정`)

        const sensorTypes = site.sensorTypes || ['ultrasonic']
        const totalSensorCount = site.sensorCount || 1
        const sensorsPerType = sensorTypes.length === 1 ? totalSensorCount : Math.max(1, Math.floor(totalSensorCount / sensorTypes.length))

        for (const sensorType of sensorTypes) {
          const sensorCount = sensorTypes.length === 1 ? totalSensorCount : sensorsPerType

          for (let sensorNum = 1; sensorNum <= sensorCount; sensorNum++) {
            const sensorKey = `${sensorType}_${sensorNum.toString().padStart(2, '0')}`
            const sensorRef = ref(database, `sensors/${site.id}/${sensorKey}`)

            // 오프라인 상태로 설정
            await set(sensorRef, {
              status: 'offline',
              timestamp: Date.now(),
              [sensorType]: null
            })
          }
        }
      }
    } catch (error) {
      console.error('비활성 현장 오프라인 설정 오류:', error)
    }

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

          // 시뮬레이션 실행 중이라면, 새로 활성화된 사이트의 센서를 즉시 시뮬레이션에 포함
          if (isRunning) {
            const prevSites = simulationConfig.sites
            const newActiveSites = sitesList.filter(site =>
              site.status === 'active' &&
              (!prevSites.find(prev => prev.id === site.id) ||
               prevSites.find(prev => prev.id === site.id)?.status !== 'active')
            )

            // 새로 활성화된 현장들의 센서를 정상 상태로 즉시 설정
            for (const site of newActiveSites) {
              console.log(`🟢 [시뮬레이션] 새로 활성화된 현장: ${site.name} (${site.id})`)
              debug(`🟢 새로 활성화된 현장 ${site.name} 센서 초기화`)

              const sensorTypes = site.sensorTypes || ['ultrasonic']
              const totalSensorCount = site.sensorCount || 1
              const sensorsPerType = sensorTypes.length === 1 ? totalSensorCount : Math.max(1, Math.floor(totalSensorCount / sensorTypes.length))

              for (const sensorType of sensorTypes) {
                const sensorCount = sensorTypes.length === 1 ? totalSensorCount : sensorsPerType

                for (let sensorNum = 1; sensorNum <= sensorCount; sensorNum++) {
                  // 즉시 정상 상태 센서 데이터 생성 (여러 번 시도로 확실히 적용)
                  setTimeout(async () => {
                    await forceSensorStatus(site.id, sensorType, sensorNum, 'normal')
                  }, 100)

                  // 추가 확인을 위해 한 번 더 실행
                  setTimeout(async () => {
                    await forceSensorStatus(site.id, sensorType, sensorNum, 'normal')
                    // UI 강제 새로고침 트리거
                    console.log(`✅ [시뮬레이션] ${site.name}의 ${sensorType}_${sensorNum} 센서 정상 상태로 설정 완료`)
                  }, 500)

                  // 마지막 수단: 1초 후 페이지 강제 새로고침
                  setTimeout(() => {
                    console.log(`🔄 [시뮬레이션] ${site.name} 현장 활성화 완료 - UI 새로고침`)
                    window.dispatchEvent(new Event('storage')) // React 상태 업데이트 트리거
                  }, 1000)
                }
              }
            }
          }

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

    // 센서 메타데이터 업데이트 함수
    updateSensorMetadata: async (siteId, sensorKey, metadata) => {
      try {
        debug('📝 센서 메타데이터 업데이트 시작:', { siteId, sensorKey, metadata })

        const sensorRef = ref(database, `sensors/${siteId}/${sensorKey}`)

        // 현재 센서 데이터 가져오기
        const snapshot = await get(sensorRef)
        if (!snapshot.exists()) {
          logError('❌ 센서 데이터를 찾을 수 없습니다:', { siteId, sensorKey })
          return false
        }

        const currentData = snapshot.val()

        // 메타데이터 업데이트 (undefined 값 필터링)
        const updatedData = { ...currentData }

        // 각 필드를 개별적으로 처리하여 undefined 방지
        if (metadata.location !== undefined && metadata.location !== '') {
          updatedData.location = metadata.location
        }
        if (metadata.hardwareModel !== undefined && metadata.hardwareModel !== '') {
          updatedData.hardwareModel = metadata.hardwareModel
        }
        if (metadata.firmwareVersion !== undefined && metadata.firmwareVersion !== '') {
          updatedData.firmwareVersion = metadata.firmwareVersion
        }
        if (metadata.installDate !== undefined) {
          updatedData.installDate = metadata.installDate
        }
        if (metadata.lastMaintenance !== undefined) {
          updatedData.lastMaintenance = metadata.lastMaintenance
        }
        if (metadata.calibrationDate !== undefined) {
          updatedData.calibrationDate = metadata.calibrationDate
        }
        if (metadata.warrantyExpire !== undefined) {
          updatedData.warrantyExpire = metadata.warrantyExpire
        }

        // 업데이트 시간은 항상 설정
        updatedData.lastUpdate = Date.now()

        // Firebase에 업데이트
        await update(sensorRef, updatedData)

        debug('✅ 센서 메타데이터 업데이트 완료:', { siteId, sensorKey })
        return true
      } catch (error) {
        logError('❌ 센서 메타데이터 업데이트 오류:', error)
        return false
      }
    },

    // 유틸리티
    availableModes: [
      { value: 'gentle', label: '미미한 변화' },
      { value: 'gradual', label: '점진적 변화' },
      { value: 'scenario', label: '시나리오 기반' },
      { value: 'random', label: '랜덤 시뮬레이션' }
    ],
    availableStatuses: ['normal', 'warning', 'alert', 'offline']
  }

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  )
}
