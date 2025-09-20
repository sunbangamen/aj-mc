import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { STAT_COLORS, STAT_ICONS, STAT_LABELS } from '../utils/dashboardStats'
import { extractSensorsFromSiteData, parseSensorKey, getSensorDisplayName } from '../types/sensor'
import { computeRepresentativeStatus } from '../utils/representativeStatus'
import { useAlertSystem } from '../hooks/useAlertSystem'
import { useSites } from '../hooks/useSiteManagement'

function SystemStatsCards({ allSites, connectionStatus }) {
  const { loadThresholds, loadSiteThresholds } = useAlertSystem()
  const [globalThresholds, setGlobalThresholds] = useState(null)
  const [siteThresholds, setSiteThresholds] = useState({})
  const { sites } = useSites()
  const siteNameMap = useMemo(() => {
    const m = {}
    ;(sites || []).forEach(s => { if (s?.id) m[s.id] = s.name || s.id })
    return m
  }, [sites])

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

  // 상위 이슈 리스트(최대 3) - 대표 상태가 비정상인 현장
  const topIssues = useMemo(() => {
    const entries = []
    for (const { siteId, ...siteData } of allSites || []) {
      const timeouts = siteThresholds?.[siteId] || globalThresholds
      const rep = computeRepresentativeStatus(siteData, timeouts)
      if (rep.status && rep.status !== 'normal') {
        entries.push({ siteId, status: rep.status, causeKey: rep.causeKey, timestamp: rep.timestamp })
      }
    }
    const severity = { offline: 0, normal: 1, warning: 2, alert: 3 }
    entries.sort((a, b) => {
      const sa = severity[a.status] ?? 0
      const sb = severity[b.status] ?? 0
      if (sa !== sb) return sb - sa
      return (b.timestamp || 0) - (a.timestamp || 0)
    })
    return entries.slice(0, 3)
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

      {/* 상위 이슈(대표 상태 비정상인 현장) */}
      {topIssues.length > 0 && (
        <div className="top-issues" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>주요 이슈</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topIssues.map(item => {
              const name = siteNameMap[item.siteId] || item.siteId
              const parsed = item.causeKey ? parseSensorKey(item.causeKey) : null
              const sensorLabel = parsed ? `${getSensorDisplayName(parsed.sensorType)} ${parsed.sensorNumber}` : (item.causeKey || '-')
              const color = STAT_COLORS[item.status] || '#111827'
              return (
                <Link
                  key={item.siteId}
                  to={`/site/${item.siteId}`}
                  className="issue-row"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit' }}
                >
                  <span style={{ width: 12, height: 12, borderRadius: 6, background: color }}></span>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                  <span style={{ color: '#6b7280' }}>•</span>
                  <span>{item.status === 'alert' ? '경고' : item.status === 'warning' ? '주의' : item.status === 'offline' ? '오프라인' : item.status}</span>
                  {item.causeKey && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>원인: {sensorLabel}</span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemStatsCards
