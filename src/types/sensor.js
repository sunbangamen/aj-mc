// 센서 데이터 타입 정의 (JSDoc으로 타입 힌트 제공)

/**
 * 센서 상태 타입
 * @typedef {'normal' | 'warning' | 'alert' | 'offline'} SensorStatus
 */

/**
 * 센서 데이터 타입
 * @typedef {Object} SensorData
 * @property {number} distance - 거리값 (cm)
 * @property {number} timestamp - Unix timestamp (ms)
 * @property {SensorStatus} status - 센서 상태
 */

/**
 * 현장 데이터 타입
 * @typedef {Object} SiteData
 * @property {SensorData & {history?: Object.<string, SensorData>}} ultrasonic - 초음파 센서 데이터
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
