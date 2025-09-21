import { extractSensorsFromSiteData, normalizeStatus } from '../types/sensor'

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
  if (!sensors || sensors.length === 0) {
    return { status: 'offline', timestamp: 0 }
  }

  let rep = { status: 'offline', timestamp: 0, severity: 0, causeKey: null, causeType: null }
  for (const s of sensors) {
    const sensorType = (s.key || '').split('_')[0]
    const timeoutMs = getTimeoutMs(sensorType, thresholds)

    // 현재 노드의 상태/타임스탬프(ms 또는 s)
    const currentStatus = normalizeStatus(s.data?.status)
    const currentTs = s.data?.lastUpdate || s.data?.timestamp || 0

    // 최신 히스토리(있다면) 추출
    let latestHistTs = 0
    let latestHistStatus = null
    const hist = s.data?.history
    if (hist && typeof hist === 'object') {
      const keys = Object.keys(hist)
      if (keys.length > 0) {
        const parsed = keys.map(k => parseInt(k, 10) || 0)
        latestHistTs = Math.max(...parsed)
        const histEntry = hist[String(latestHistTs)]
        latestHistStatus = normalizeStatus(histEntry?.status)
      }
    }

    // 후보 타임스탬프/상태 선택 (가장 최신 기준)
    const chosenTs = Math.max(currentTs || 0, latestHistTs || 0)
    const chosenStatus = (chosenTs === latestHistTs && latestHistStatus) ? latestHistStatus : currentStatus

    // 하드웨어는 초 단위, 웹은 밀리초 단위이므로 맞춰서 비교
    const nowSec = Math.floor(now / 1000)
    const chosenSec = chosenTs > 1000000000000 ? Math.floor(chosenTs / 1000) : chosenTs
    const timeoutSec = Math.floor(timeoutMs / 1000)

    // 미래 시각 허용 오차 (초). 이보다 크면 비정상으로 보고 신선하지 않음 처리
    const FUTURE_SKEW_SEC = 120 // 2분 허용
    const futureSkew = chosenSec - nowSec
    let isFresh
    if (futureSkew > FUTURE_SKEW_SEC) {
      isFresh = false
    } else {
      const delta = Math.max(0, nowSec - chosenSec)
      isFresh = chosenTs && (delta < timeoutSec)
    }
    const effective = isFresh ? chosenStatus : 'offline'
    const sev = SEVERITY[effective] ?? 0
    if (sev > rep.severity || (sev === rep.severity && chosenTs > rep.timestamp)) {
      rep = { status: effective, timestamp: chosenTs, severity: sev, causeKey: s.key, causeType: sensorType }
    }
  }
  // 반환 시 내부 severity는 제외, 원인 키를 함께 제공
  return { status: rep.status, timestamp: rep.timestamp, causeKey: rep.causeKey, causeType: rep.causeType }
}
