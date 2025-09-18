// 사이트 관리 타입 정의 (JSDoc으로 타입 힌트 제공)

/**
 * 사이트 상태 타입
 * @typedef {'active' | 'inactive' | 'maintenance'} SiteStatus
 */

/**
 * 센서 타입
 * @typedef {'ultrasonic' | 'temperature' | 'humidity' | 'pressure'} SensorType
 */

/**
 * 사이트 데이터 타입
 * @typedef {Object} SiteData
 * @property {string} id - 사이트 고유 ID
 * @property {string} name - 현장명
 * @property {string} location - 현장 위치/주소
 * @property {string} description - 현장 설명
 * @property {number} sensorCount - 센서 개수
 * @property {SensorType[]} sensorTypes - 센서 타입 목록
 * @property {SiteStatus} status - 사이트 상태
 * @property {number} createdAt - 생성 시간 (Unix timestamp)
 * @property {number} updatedAt - 수정 시간 (Unix timestamp)
 */

// 사이트 상태별 색상 매핑
export const SITE_STATUS_COLORS = {
  active: '#27ae60',    // 녹색 - 활성
  inactive: '#95a5a6',  // 회색 - 비활성
  maintenance: '#f39c12' // 주황색 - 점검중
}

// 사이트 상태별 한글명
export const SITE_STATUS_LABELS = {
  active: '활성',
  inactive: '비활성',
  maintenance: '점검중'
}

// 센서 타입별 한글명
export const SENSOR_TYPE_LABELS = {
  ultrasonic: '초음파',
  temperature: '온도',
  humidity: '습도',
  pressure: '압력'
}

// 센서 타입별 아이콘
export const SENSOR_TYPE_ICONS = {
  ultrasonic: '📡',
  temperature: '🌡️',
  humidity: '💧',
  pressure: '📊'
}

// 기본 사이트 템플릿
export const DEFAULT_SITE_TEMPLATE = {
  name: '',
  location: '',
  description: '',
  sensorCount: 1,
  sensorTypes: ['ultrasonic'],
  status: 'active'
}

// 사이트 ID 생성 함수
export const generateSiteId = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `site_${timestamp}_${random}`
}

// 사이트 데이터 유효성 검증 함수
export const isValidSiteData = (siteData) => {
  return (
    siteData &&
    typeof siteData.id === 'string' &&
    typeof siteData.name === 'string' &&
    typeof siteData.location === 'string' &&
    typeof siteData.sensorCount === 'number' &&
    Array.isArray(siteData.sensorTypes) &&
    Object.keys(SITE_STATUS_LABELS).includes(siteData.status)
  )
}

// 사이트 목록 정렬 함수
export const sortSites = (sites, sortBy = 'name') => {
  if (!Array.isArray(sites)) return []

  return sites.slice().sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'createdAt':
        return b.createdAt - a.createdAt // 최신순
      case 'updatedAt':
        return b.updatedAt - a.updatedAt // 최신순
      case 'status':
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })
}

// 사이트 통계 계산 함수
export const calculateSiteStats = (sites) => {
  if (!Array.isArray(sites)) return { total: 0, active: 0, inactive: 0, maintenance: 0, totalSensors: 0 }

  return sites.reduce((stats, site) => {
    stats.total++
    stats[site.status]++
    stats.totalSensors += site.sensorCount
    return stats
  }, { total: 0, active: 0, inactive: 0, maintenance: 0, totalSensors: 0 })
}