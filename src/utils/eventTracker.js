/**
 * 시스템 이벤트 추적 유틸리티
 */

/**
 * 이벤트 타입 정의
 */
export const EVENT_TYPES = {
  STATUS_CHANGE: 'status_change',
  SITE_OFFLINE: 'site_offline',
  SITE_ONLINE: 'site_online',
  ALERT_TRIGGERED: 'alert_triggered',
  SIMULATION_START: 'simulation_start',
  SIMULATION_STOP: 'simulation_stop'
}

/**
 * 이벤트 우선순위
 */
export const EVENT_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

/**
 * 이벤트 아이콘 매핑
 */
export const EVENT_ICONS = {
  [EVENT_TYPES.STATUS_CHANGE]: '🔄',
  [EVENT_TYPES.SITE_OFFLINE]: '⚫',
  [EVENT_TYPES.SITE_ONLINE]: '🟢',
  [EVENT_TYPES.ALERT_TRIGGERED]: '🚨',
  [EVENT_TYPES.SIMULATION_START]: '▶️',
  [EVENT_TYPES.SIMULATION_STOP]: '⏹️'
}

/**
 * 실시간 이벤트 생성
 * @param {Array} allSites - 모든 사이트 데이터
 * @param {Array} previousSites - 이전 사이트 데이터 (비교용)
 * @returns {Array} 최근 이벤트 목록
 */
export const generateRecentEvents = (allSites, previousSites = []) => {
  const events = []
  const now = new Date()

  // 사이트별 상태 변화 감지
  allSites.forEach(({ siteId, ultrasonic }) => {
    const currentStatus = ultrasonic?.status || 'offline'
    const previousSite = previousSites.find(site => site.siteId === siteId)
    const previousStatus = previousSite?.ultrasonic?.status || 'offline'

    // 상태 변화 감지
    if (previousSite && currentStatus !== previousStatus) {
      const eventTime = new Date(now.getTime() - Math.random() * 30 * 60 * 1000) // 0-30분 전

      events.push({
        id: `${siteId}-${currentStatus}-${Date.now()}`,
        type: EVENT_TYPES.STATUS_CHANGE,
        siteId,
        siteName: getSiteName(siteId),
        message: `${previousStatus} → ${currentStatus}`,
        status: currentStatus,
        timestamp: eventTime,
        priority: getPriorityByStatus(currentStatus),
        icon: EVENT_ICONS[EVENT_TYPES.STATUS_CHANGE]
      })
    }

    // 오프라인/온라인 이벤트
    if (currentStatus === 'offline' && previousStatus !== 'offline') {
      events.push({
        id: `${siteId}-offline-${Date.now()}`,
        type: EVENT_TYPES.SITE_OFFLINE,
        siteId,
        siteName: getSiteName(siteId),
        message: '오프라인 상태',
        status: 'offline',
        timestamp: new Date(now.getTime() - Math.random() * 60 * 60 * 1000), // 0-1시간 전
        priority: EVENT_PRIORITY.HIGH,
        icon: EVENT_ICONS[EVENT_TYPES.SITE_OFFLINE]
      })
    }

    // 경고 이벤트
    if (currentStatus === 'alert') {
      events.push({
        id: `${siteId}-alert-${Date.now()}`,
        type: EVENT_TYPES.ALERT_TRIGGERED,
        siteId,
        siteName: getSiteName(siteId),
        message: '경고 상태 감지',
        status: 'alert',
        timestamp: new Date(now.getTime() - Math.random() * 15 * 60 * 1000), // 0-15분 전
        priority: EVENT_PRIORITY.HIGH,
        icon: EVENT_ICONS[EVENT_TYPES.ALERT_TRIGGERED]
      })
    }
  })

  // 시뮬레이션 관련 이벤트 (더미 데이터)
  if (Math.random() > 0.7) { // 30% 확률로 시뮬레이션 이벤트 추가
    events.push({
      id: `simulation-${Date.now()}`,
      type: EVENT_TYPES.SIMULATION_START,
      siteId: 'system',
      siteName: '시스템',
      message: '센서 시뮬레이션 시작',
      status: 'normal',
      timestamp: new Date(now.getTime() - Math.random() * 120 * 60 * 1000), // 0-2시간 전
      priority: EVENT_PRIORITY.LOW,
      icon: EVENT_ICONS[EVENT_TYPES.SIMULATION_START]
    })
  }

  // 최신순으로 정렬하고 최대 10개만 반환
  return events
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)
}

/**
 * 가상의 사이트 이름 가져오기
 * @param {string} siteId
 * @returns {string}
 */
function getSiteName(siteId) {
  const siteNames = {
    'test': '테스트 현장',
    'site1': '현장 A',
    'site2': '현장 B',
    'site3': '현장 C'
  }
  return siteNames[siteId] || siteId
}

/**
 * 상태에 따른 우선순위 결정
 * @param {string} status
 * @returns {string}
 */
function getPriorityByStatus(status) {
  switch (status) {
    case 'alert':
      return EVENT_PRIORITY.HIGH
    case 'warning':
      return EVENT_PRIORITY.MEDIUM
    case 'normal':
    case 'offline':
    default:
      return EVENT_PRIORITY.LOW
  }
}

/**
 * 시간 차이를 사람이 읽기 쉬운 형태로 변환
 * @param {Date} timestamp
 * @returns {string}
 */
export const formatTimeAgo = (timestamp) => {
  const now = new Date()
  const diffMs = now - timestamp
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  return `${diffDays}일 전`
}