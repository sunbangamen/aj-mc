/**
 * 대시보드 통계 계산 유틸리티
 */

import { extractSensorsFromSiteData } from '../types/sensor'

// 상태 심각도(높을수록 위험)
const SEVERITY = { offline: 0, normal: 1, warning: 2, alert: 3 }

const getRepresentativeStatus = (siteData) => {
  const sensors = extractSensorsFromSiteData(siteData)
  if (!sensors || sensors.length === 0) return { status: 'offline', timestamp: 0 }

  let rep = { status: 'offline', timestamp: 0, severity: SEVERITY.offline }
  for (const s of sensors) {
    const status = s.data?.status || 'offline'
    const ts = s.data?.timestamp || 0
    const sev = SEVERITY[status] ?? 0
    if (sev > rep.severity || (sev === rep.severity && ts > rep.timestamp)) {
      rep = { status, timestamp: ts, severity: sev }
    }
  }
  return rep
}

/**
 * 전체 현장 통계 계산(다중 센서 대응)
 * @param {Array} allSites - 모든 사이트 데이터 ({ siteId, ...siteData })
 * @returns {Object} 통계 객체
 */
export const calculateSystemStats = (allSites) => {
  if (!allSites || allSites.length === 0) {
    return { total: 0, normal: 0, warning: 0, alert: 0, offline: 0, connected: 0, lastUpdate: null }
  }

  const stats = { total: allSites.length, normal: 0, warning: 0, alert: 0, offline: 0, connected: 0, lastUpdate: null }
  let latestTimestamp = 0

  for (const { siteId, ...siteData } of allSites) {
    const rep = getRepresentativeStatus(siteData)
    const status = rep.status

    if (status === 'normal') { stats.normal++; stats.connected++ }
    else if (status === 'warning') { stats.warning++; stats.connected++ }
    else if (status === 'alert') { stats.alert++; stats.connected++ }
    else { stats.offline++ }

    if (rep.timestamp > latestTimestamp) latestTimestamp = rep.timestamp
  }

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
