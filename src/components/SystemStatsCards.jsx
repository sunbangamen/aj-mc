import React, { useEffect, useMemo, useState } from 'react'
import { STAT_COLORS, STAT_ICONS, STAT_LABELS } from '../utils/dashboardStats'
import { extractSensorsFromSiteData } from '../types/sensor'
import { computeRepresentativeStatus } from '../utils/representativeStatus'
import { useAlertSystem } from '../hooks/useAlertSystem'

function SystemStatsCards({ allSites, connectionStatus }) {
  const { loadThresholds, loadSiteThresholds } = useAlertSystem()
  const [globalThresholds, setGlobalThresholds] = useState(null)
  const [siteThresholds, setSiteThresholds] = useState({})

  // Load global thresholds once
  useEffect(() => {
    let mounted = true
    loadThresholds(null).then(t => { if (mounted) setGlobalThresholds(t) }).catch(() => {})
    return () => { mounted = false }
  }, [])

  // Prefetch per-site thresholds (cached in hook)
  useEffect(() => {
    let mounted = true
    const siteIds = Array.from(new Set((allSites || []).map(s => s.siteId)))
    Promise.all(siteIds.map(id => loadSiteThresholds(id).then(t => ({ id, t })).catch(() => ({ id, t: null })))).then(list => {
      if (!mounted) return
      const map = {}
      list.forEach(({ id, t }) => { map[id] = t })
      setSiteThresholds(map)
    })
    return () => { mounted = false }
  }, [JSON.stringify((allSites || []).map(s => s.siteId))])

  const stats = useMemo(() => {
    if (!allSites || allSites.length === 0) {
      return { total: 0, normal: 0, warning: 0, alert: 0, offline: 0, connected: 0, lastUpdate: null }
    }
    const out = { total: allSites.length, normal: 0, warning: 0, alert: 0, offline: 0, connected: 0, lastUpdate: null }
    let latestTs = 0

    for (const { siteId, ...siteData } of allSites) {
      const timeouts = siteThresholds?.[siteId] || globalThresholds
      const rep = computeRepresentativeStatus(siteData, timeouts)
      if (rep.status === 'normal') { out.normal++; out.connected++ }
      else if (rep.status === 'warning') { out.warning++; out.connected++ }
      else if (rep.status === 'alert') { out.alert++; out.connected++ }
      else { out.offline++ }
      if (rep.timestamp > latestTs) latestTs = rep.timestamp
    }

    out.lastUpdate = latestTs ? new Date(latestTs).toLocaleTimeString() : null
    return out
  }, [allSites, globalThresholds, siteThresholds])

  const statItems = [
    { key: 'total', value: stats.total },
    { key: 'normal', value: stats.normal },
    { key: 'warning', value: stats.warning },
    { key: 'alert', value: stats.alert },
    { key: 'offline', value: stats.offline }
  ]

  return (
    <div className="system-stats-section">
      <div className="stats-header">
        <h2>📊 시스템 현황</h2>
        <div className="connection-indicator">
          <span className={`status-dot ${connectionStatus}`}></span>
          <span className="status-text">
            {connectionStatus === 'connected' ? '실시간 연결' : '연결 안됨'}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        {statItems.map(({ key, value }) => (
          <div
            key={key}
            className={`stat-card stat-${key}`}
            style={{ borderColor: STAT_COLORS[key] }}
          >
            <div className="stat-icon">
              {STAT_ICONS[key]}
            </div>
            <div className="stat-content">
              <div
                className="stat-value"
                style={{ color: STAT_COLORS[key] }}
              >
                {value}
              </div>
              <div className="stat-label">
                {STAT_LABELS[key]}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="stats-summary">
        <div className="summary-item">
          <span className="summary-label">연결된 현장:</span>
          <span className="summary-value" style={{ color: STAT_COLORS.connected }}>
            {stats.connected}/{stats.total}
          </span>
        </div>
        {stats.lastUpdate && (
          <div className="summary-item">
            <span className="summary-label">마지막 업데이트:</span>
            <span className="summary-value">
              {stats.lastUpdate}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemStatsCards
