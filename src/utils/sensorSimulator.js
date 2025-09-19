/**
 * 센서 데이터 시뮬레이션 유틸리티
 * 실제 센서 없이도 다양한 상태의 센서 데이터를 생성
 */

// 센서 타입별 시뮬레이션 설정
export const SENSOR_SIMULATION_CONFIG = {
  ultrasonic: {
    normal: { min: 30, max: 99, status: 'normal' },
    warning: { min: 100, max: 199, status: 'warning' },
    alert: { min: 200, max: 300, status: 'alert' },
    offline: { distance: null, status: 'offline' }
  },
  temperature: {
    normal: { min: 18, max: 25, status: 'normal' },
    warning: { min: 26, max: 35, status: 'warning' },
    alert: { min: 36, max: 50, status: 'alert' },
    offline: { temperature: null, status: 'offline' }
  },
  humidity: {
    normal: { min: 40, max: 60, status: 'normal' },
    warning: { min: 61, max: 80, status: 'warning' },
    alert: { min: 81, max: 95, status: 'alert' },
    offline: { humidity: null, status: 'offline' }
  },
  pressure: {
    normal: { min: 1000, max: 1020, status: 'normal' },
    warning: { min: 990, max: 999, status: 'warning' },
    alert: { min: 980, max: 989, status: 'alert' },
    offline: { pressure: null, status: 'offline' }
  }
}

// 상태별 확률 (정상 상태가 더 자주 나오도록)
export const STATUS_PROBABILITY = {
  normal: 0.7,    // 70%
  warning: 0.2,   // 20%
  alert: 0.08,    // 8%
  offline: 0.02   // 2%
}

/**
 * 확률에 따라 랜덤 상태 선택
 */
export const getRandomStatus = () => {
  const random = Math.random()
  let cumulative = 0

  for (const [status, probability] of Object.entries(STATUS_PROBABILITY)) {
    cumulative += probability
    if (random <= cumulative) {
      return status
    }
  }
  return 'normal' // 기본값
}

/**
 * 특정 범위 내에서 랜덤 숫자 생성
 */
export const getRandomInRange = (min, max, decimals = 0) => {
  const random = Math.random() * (max - min) + min
  return Number(random.toFixed(decimals))
}

/**
 * Phase 14D: 하드웨어 메타데이터 생성
 */
export const generateHardwareMetadata = (sensorType = 'ultrasonic') => {
  const hardwareModels = {
    ultrasonic: ['HC-SR04', 'JSN-SR04T', 'US-100'],
    temperature: ['DHT22', 'DS18B20', 'SHT30'],
    humidity: ['DHT22', 'SHT30', 'HIH6130'],
    pressure: ['BMP280', 'BME680', 'MS5611']
  }

  const models = hardwareModels[sensorType] || hardwareModels.ultrasonic
  const selectedModel = models[getRandomInRange(0, models.length - 1)]

  return {
    batteryLevel: getRandomInRange(15, 100), // 15-100% (배터리 부족 시뮬레이션 포함)
    signalStrength: getRandomInRange(-80, -20), // -80 ~ -20 dBm (일반적인 WiFi 신호 범위)
    firmwareVersion: `v1.${getRandomInRange(0, 5)}.${getRandomInRange(0, 9)}`, // v1.0.0 ~ v1.5.9
    hardwareModel: selectedModel
  }
}

/**
 * Phase 14D: 유지보수 정보 생성 (설치 후 경과 시간 기반)
 */
export const generateMaintenanceInfo = () => {
  const now = Date.now()
  const daysAgo = (days) => now - (days * 24 * 60 * 60 * 1000)

  return {
    installDate: daysAgo(getRandomInRange(30, 365)), // 30일 ~ 1년 전 설치
    lastMaintenance: daysAgo(getRandomInRange(7, 90)), // 1주 ~ 3개월 전 점검
    calibrationDate: daysAgo(getRandomInRange(14, 180)), // 2주 ~ 6개월 전 교정
    warrantyExpire: now + (getRandomInRange(6, 24) * 30 * 24 * 60 * 60 * 1000) // 6개월 ~ 2년 후 만료
  }
}

/**
 * Phase 14D: 측정 품질 지표 생성
 */
export const generateQualityMetrics = (status) => {
  // 상태에 따라 품질 지표가 달라짐
  const baseAccuracy = status === 'normal' ? 95 : status === 'warning' ? 85 : 70
  const baseReliability = status === 'normal' ? 'high' : status === 'warning' ? 'medium' : 'low'

  return {
    accuracy: getRandomInRange(baseAccuracy - 5, baseAccuracy + 5, 1), // ±5% 범위
    reliability: baseReliability,
    errorCount: getRandomInRange(0, status === 'normal' ? 2 : status === 'warning' ? 8 : 20),
    consecutiveErrors: status === 'alert' ? getRandomInRange(1, 5) : 0
  }
}

/**
 * 초음파 센서 데이터 생성
 */
export const generateUltrasonicData = (forceStatus = null) => {
  const status = forceStatus || getRandomStatus()
  const config = SENSOR_SIMULATION_CONFIG.ultrasonic[status]
  const timestamp = Date.now()

  if (status === 'offline') {
    return {
      distance: null,
      status: 'offline',
      timestamp,
      lastUpdate: timestamp
    }
  }

  const distance = getRandomInRange(config.min, config.max)

  return {
    distance,
    status: config.status,
    timestamp,
    lastUpdate: timestamp,

    // Phase 14D: 운영 메타데이터 추가
    ...generateHardwareMetadata('ultrasonic'),
    ...generateMaintenanceInfo(),
    ...generateQualityMetrics(status)
  }
}

/**
 * 온도 센서 데이터 생성
 */
export const generateTemperatureData = (forceStatus = null) => {
  const status = forceStatus || getRandomStatus()
  const config = SENSOR_SIMULATION_CONFIG.temperature[status]
  const timestamp = Date.now()

  if (status === 'offline') {
    return {
      temperature: null,
      status: 'offline',
      timestamp,
      lastUpdate: timestamp
    }
  }

  const temperature = getRandomInRange(config.min, config.max, 1)

  return {
    value: temperature, // 온도는 value 키 사용
    temperature, // 하위 호환성
    status: config.status,
    timestamp,
    lastUpdate: timestamp,

    // Phase 14D: 운영 메타데이터 추가
    ...generateHardwareMetadata('temperature'),
    ...generateMaintenanceInfo(),
    ...generateQualityMetrics(status)
  }
}

/**
 * 습도 센서 데이터 생성
 */
export const generateHumidityData = (forceStatus = null) => {
  const status = forceStatus || getRandomStatus()
  const config = SENSOR_SIMULATION_CONFIG.humidity[status]
  const timestamp = Date.now()

  if (status === 'offline') {
    return {
      humidity: null,
      status: 'offline',
      timestamp,
      lastUpdate: timestamp
    }
  }

  const humidity = getRandomInRange(config.min, config.max)

  return {
    value: humidity, // 습도는 value 키 사용
    humidity, // 하위 호환성
    status: config.status,
    timestamp,
    lastUpdate: timestamp,

    // Phase 14D: 운영 메타데이터 추가
    ...generateHardwareMetadata('humidity'),
    ...generateMaintenanceInfo(),
    ...generateQualityMetrics(status)
  }
}

/**
 * 압력 센서 데이터 생성
 */
export const generatePressureData = (forceStatus = null) => {
  const status = forceStatus || getRandomStatus()
  const config = SENSOR_SIMULATION_CONFIG.pressure[status]
  const timestamp = Date.now()

  if (status === 'offline') {
    return {
      pressure: null,
      status: 'offline',
      timestamp,
      lastUpdate: timestamp
    }
  }

  const pressure = getRandomInRange(config.min, config.max, 1)

  return {
    value: pressure, // 압력은 value 키 사용
    pressure, // 하위 호환성
    status: config.status,
    timestamp,
    lastUpdate: timestamp,

    // Phase 14D: 운영 메타데이터 추가
    ...generateHardwareMetadata('pressure'),
    ...generateMaintenanceInfo(),
    ...generateQualityMetrics(status)
  }
}

/**
 * 센서 타입에 따른 데이터 생성 함수 매핑
 */
export const SENSOR_GENERATORS = {
  ultrasonic: generateUltrasonicData,
  temperature: generateTemperatureData,
  humidity: generateHumidityData,
  pressure: generatePressureData
}

/**
 * 특정 센서 타입의 데이터 생성
 */
export const generateSensorData = (sensorType, forceStatus = null) => {
  const generator = SENSOR_GENERATORS[sensorType]
  if (!generator) {
    throw new Error(`Unknown sensor type: ${sensorType}`)
  }
  return generator(forceStatus)
}

/**
 * 시나리오 기반 상태 변화 시뮬레이션
 * 정상 → 경고 → 정상 같은 패턴 생성
 */
export const createStatusScenario = (pattern = ['normal', 'warning', 'alert', 'normal']) => {
  let currentIndex = 0

  return () => {
    const status = pattern[currentIndex]
    currentIndex = (currentIndex + 1) % pattern.length
    return status
  }
}

/**
 * 점진적 변화 시뮬레이션 (더 현실적인 데이터)
 * 이전 값에서 조금씩 변화하는 패턴
 */
export const createGradualChangeSimulator = (sensorType, initialValue = null) => {
  const config = SENSOR_SIMULATION_CONFIG[sensorType]
  let currentValue = initialValue || getRandomInRange(config.normal.min, config.normal.max)

  return (maxChange = 5) => {
    // 이전 값에서 ±maxChange만큼 변화
    const change = getRandomInRange(-maxChange, maxChange, 1)
    currentValue += change

    // 범위 제한
    const allValues = Object.values(config).filter(c => c.min !== undefined)
    const globalMin = Math.min(...allValues.map(c => c.min))
    const globalMax = Math.max(...allValues.map(c => c.max))

    currentValue = Math.max(globalMin, Math.min(globalMax, currentValue))

    // 상태 결정
    let status = 'normal'
    for (const [statusName, range] of Object.entries(config)) {
      if (statusName !== 'offline' &&
          currentValue >= range.min &&
          currentValue <= range.max) {
        status = range.status
        break
      }
    }

    const timestamp = Date.now()
    const valueKey = sensorType === 'ultrasonic' ? 'distance' : sensorType

    return {
      [valueKey]: Number(currentValue.toFixed(1)),
      status,
      timestamp,
      lastUpdate: timestamp
    }
  }
}