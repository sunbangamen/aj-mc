// 센서 데이터 타입 정의 (JSDoc으로 타입 힌트 제공)

/**
 * 센서 상태 타입
 * @typedef {'normal' | 'warning' | 'alert' | 'offline'} SensorStatus
 */

/**
 * 기본 센서 데이터 타입
 * @typedef {Object} BaseSensorData
 * @property {number} timestamp - Unix timestamp (ms)
 * @property {SensorStatus} status - 센서 상태
 * @property {string} [deviceId] - 하드웨어 디바이스 ID (선택사항)
 * @property {string} [location] - 센서 설치 위치 (선택사항)
 * @property {number} [batteryLevel] - 배터리 잔량 (선택사항)
 * @property {number} [signalStrength] - 신호 강도 (선택사항)
 */

/**
 * 초음파 센서 데이터 타입
 * @typedef {BaseSensorData} UltrasonicSensorData
 * @property {number} distance - 거리값 (cm)
 */

/**
 * 온도 센서 데이터 타입
 * @typedef {BaseSensorData} TemperatureSensorData
 * @property {number} value - 온도값 (°C)
 */

/**
 * 습도 센서 데이터 타입
 * @typedef {BaseSensorData} HumiditySensorData
 * @property {number} value - 습도값 (%)
 */

/**
 * 압력 센서 데이터 타입
 * @typedef {BaseSensorData} PressureSensorData
 * @property {number} value - 압력값 (hPa)
 */

/**
 * 센서 데이터 타입 (하위 호환성을 위한 기존 타입)
 * @typedef {UltrasonicSensorData} SensorData
 */

/**
 * 다중 센서 지원 현장 데이터 타입
 * @typedef {Object} MultiSensorSiteData
 * @property {UltrasonicSensorData & {history?: Object.<string, UltrasonicSensorData>}} [ultrasonic] - 단일 초음파 센서 (하위 호환성)
 * @property {UltrasonicSensorData & {history?: Object.<string, UltrasonicSensorData>}} [ultrasonic_01] - 첫 번째 초음파 센서
 * @property {UltrasonicSensorData & {history?: Object.<string, UltrasonicSensorData>}} [ultrasonic_02] - 두 번째 초음파 센서
 * @property {UltrasonicSensorData & {history?: Object.<string, UltrasonicSensorData>}} [ultrasonic_03] - 세 번째 초음파 센서
 * @property {TemperatureSensorData & {history?: Object.<string, TemperatureSensorData>}} [temperature_01] - 첫 번째 온도 센서
 * @property {HumiditySensorData & {history?: Object.<string, HumiditySensorData>}} [humidity_01] - 첫 번째 습도 센서
 * @property {PressureSensorData & {history?: Object.<string, PressureSensorData>}} [pressure_01] - 첫 번째 압력 센서
 */

/**
 * 현장 데이터 타입 (하위 호환성을 위한 기존 타입)
 * @typedef {MultiSensorSiteData} SiteData
 */

/**
 * 전체 센서 데이터 타입
 * @typedef {Object.<string, SiteData>} AllSensorsData
 */

// 상태별 색상 매핑
export const STATUS_COLORS = {
  normal: '#27ae60', // 녹색
  warning: '#f39c12', // 주황색
  alert: '#e74c3c', // 빨간색
  offline: '#95a5a6', // 회색
}

// 상태별 한글명
export const STATUS_LABELS = {
  normal: '정상',
  warning: '주의',
  alert: '경고',
  offline: '오프라인',
}

// 상태 판정 함수
export const getStatusByDistance = distance => {
  if (distance < 100) return 'normal'
  if (distance <= 200) return 'warning'
  return 'alert'
}

// 시간 포맷팅 유틸리티 함수들
export const formatTime = timestamp => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export const formatDateTime = timestamp => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatChartTime = timestamp => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 히스토리 데이터 변환 함수
export const transformHistoryForChart = historyData => {
  if (!historyData || !Array.isArray(historyData)) return []

  return historyData
    .slice()
    .reverse() // 시간순 정렬 (차트용)
    .map(item => ({
      time: formatChartTime(item.timestamp),
      distance: item.distance,
      status: item.status,
      timestamp: item.timestamp,
    }))
}

// 측정 상태별 스타일 생성 함수
export const getStatusStyle = status => ({
  color: STATUS_COLORS[status] || STATUS_COLORS.offline,
  backgroundColor: `${STATUS_COLORS[status] || STATUS_COLORS.offline}15`,
  borderLeft: `3px solid ${STATUS_COLORS[status] || STATUS_COLORS.offline}`,
})

// 데이터 유효성 검증 함수
export const isValidSensorData = data => {
  return (
    data &&
    ((typeof data.distance === 'number') || (typeof data.value === 'number')) &&
    typeof data.timestamp === 'number' &&
    typeof data.status === 'string' &&
    Object.keys(STATUS_LABELS).includes(data.status)
  )
}

// 센서 타입별 데이터 값 추출 함수
export const getSensorValue = (sensorData, sensorType) => {
  if (!sensorData) return null

  if (sensorType.startsWith('ultrasonic')) {
    return sensorData.distance
  } else if (sensorType.startsWith('temperature') ||
             sensorType.startsWith('humidity') ||
             sensorType.startsWith('pressure')) {
    return sensorData.value
  }

  return sensorData.distance || sensorData.value
}

// 센서 타입별 단위 반환 함수
export const getSensorUnit = (sensorType) => {
  if (sensorType.startsWith('ultrasonic')) return 'cm'
  if (sensorType.startsWith('temperature')) return '°C'
  if (sensorType.startsWith('humidity')) return '%'
  if (sensorType.startsWith('pressure')) return 'hPa'
  return ''
}

// 센서 타입별 한글명 반환 함수
export const getSensorDisplayName = (sensorType) => {
  if (sensorType.startsWith('ultrasonic')) return '초음파'
  if (sensorType.startsWith('temperature')) return '온도'
  if (sensorType.startsWith('humidity')) return '습도'
  if (sensorType.startsWith('pressure')) return '압력'
  return sensorType
}

// 현장 데이터에서 모든 센서 목록 추출
export const extractSensorsFromSiteData = (siteData) => {
  if (!siteData) return []

  const sensors = []
  let hasNumberedSensors = false

  // 먼저 번호가 있는 센서들이 있는지 확인
  Object.keys(siteData).forEach(sensorKey => {
    if (sensorKey.includes('_') && sensorKey !== 'history') {
      hasNumberedSensors = true
    }
  })

  Object.entries(siteData).forEach(([sensorKey, sensorData]) => {
    if (sensorKey === 'history') return // 히스토리는 제외

    // 번호가 있는 센서가 있으면 기존 단일 키는 제외 (하위호환성 보장하되 중복 방지)
    if (hasNumberedSensors && !sensorKey.includes('_')) {
      return
    }

    const sensorType = sensorKey.includes('_')
      ? sensorKey.split('_')[0]
      : sensorKey

    const sensorNumber = sensorKey.includes('_')
      ? sensorKey.split('_')[1]
      : '01'

    const sensor = {
      key: sensorKey,
      type: sensorType,
      number: sensorNumber,
      displayName: `${getSensorDisplayName(sensorType)} ${sensorNumber}`,
      data: sensorData,
      value: getSensorValue(sensorData, sensorType),
      unit: getSensorUnit(sensorType),
      location: sensorData?.location || '미설정'
    }

    sensors.push(sensor)
  })

  return sensors.sort((a, b) => a.key.localeCompare(b.key))
}

// 하위 호환성: 기존 ultrasonic 키를 찾는 함수
export const getLegacySensorData = (siteData) => {
  if (!siteData) return null

  // 기존 구조 (ultrasonic) 우선 확인
  if (siteData.ultrasonic) {
    return siteData.ultrasonic
  }

  // 새 구조에서 첫 번째 초음파 센서 찾기
  if (siteData.ultrasonic_01) {
    return siteData.ultrasonic_01
  }

  return null
}
