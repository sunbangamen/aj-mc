import { extractSensorsFromSiteData } from '../types/sensor'

// 상태 심각도(높을수록 위험)
const SEVERITY = { offline: 0, normal: 1, warning: 2, alert: 3 }

export const getTimeoutMs = (sensorType, thresholds, fallbackMs = 60000) => {
  return thresholds?.[sensorType]?.offline_timeout || fallbackMs
}

/**
 * 현장의 대표 상태 계산(다중 센서)
 * - 센서별 offline_timeout 기준으로 신선도 판정
 * - 최악 상태(alert > warning > normal > offline)를 대표로, 동률이면 최신 타임스탬프 우선
 * @param {object} siteData - sensors subtree for a site
 * @param {object} thresholds - thresholds object (merged: global/site)
 * @param {number} now - optional Date.now() override (for tests)
 * @returns {{status:string, timestamp:number}}
 */
export const computeRepresentativeStatus = (siteData, thresholds, now = Date.now()) => {
  const sensors = extractSensorsFromSiteData(siteData)
  if (!sensors || sensors.length === 0) return { status: 'offline', timestamp: 0 }

  let rep = { status: 'offline', timestamp: 0, severity: 0 }
  for (const s of sensors) {
    const st = s.data?.status || 'offline'
    const ts = s.data?.lastUpdate || s.data?.timestamp || 0
    const sensorType = (s.key || '').split('_')[0]
    const timeoutMs = getTimeoutMs(sensorType, thresholds)
    const isFresh = ts && (now - ts) < timeoutMs
    const effective = isFresh ? st : 'offline'
    const sev = SEVERITY[effective] ?? 0
    if (sev > rep.severity || (sev === rep.severity && ts > rep.timestamp)) {
      rep = { status: effective, timestamp: ts, severity: sev }
    }
  }
  return { status: rep.status, timestamp: rep.timestamp }
}

