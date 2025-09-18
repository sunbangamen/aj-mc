/**
 * 대시보드 통계 계산 유틸리티
 */

/**
 * 전체 현장 통계 계산
 * @param {Array} allSites - 모든 사이트 데이터
 * @returns {Object} 통계 객체
 */
export const calculateSystemStats = (allSites) => {
  if (!allSites || allSites.length === 0) {
    return {
      total: 0,
      normal: 0,
      warning: 0,
      alert: 0,
      offline: 0,
      connected: 0,
      lastUpdate: null
    }
  }

  const stats = {
    total: allSites.length,
    normal: 0,
    warning: 0,
    alert: 0,
    offline: 0,
    connected: 0,
    lastUpdate: null
  }

  let latestTimestamp = 0

  allSites.forEach(({ siteId, ultrasonic }) => {
    const status = ultrasonic?.status || 'offline'

    // 상태별 카운트
    switch (status) {
      case 'normal':
        stats.normal++
        stats.connected++
        break
      case 'warning':
        stats.warning++
        stats.connected++
        break
      case 'alert':
        stats.alert++
        stats.connected++
        break
      case 'offline':
      default:
        stats.offline++
        break
    }

    // 최신 업데이트 시간 추적
    if (ultrasonic?.timestamp && ultrasonic.timestamp > latestTimestamp) {
      latestTimestamp = ultrasonic.timestamp
    }
  })

  // 최신 업데이트 시간을 포맷팅
  if (latestTimestamp > 0) {
    stats.lastUpdate = new Date(latestTimestamp).toLocaleTimeString()
  }

  return stats
}

/**
 * 상태별 색상 정의
 */
export const STAT_COLORS = {
  total: '#3498db',
  normal: '#27ae60',
  warning: '#f39c12',
  alert: '#e74c3c',
  offline: '#95a5a6',
  connected: '#2ecc71'
}

/**
 * 상태별 아이콘 정의
 */
export const STAT_ICONS = {
  total: '🏢',
  normal: '🟢',
  warning: '🟡',
  alert: '🔴',
  offline: '⚫',
  connected: '📡'
}

/**
 * 상태별 라벨 정의
 */
export const STAT_LABELS = {
  total: '총 현장',
  normal: '정상',
  warning: '주의',
  alert: '경고',
  offline: '오프라인',
  connected: '연결됨'
}