import React from 'react'
import {
  calculateSystemStats,
  STAT_COLORS,
  STAT_ICONS,
  STAT_LABELS
} from '../utils/dashboardStats'

function SystemStatsCards({ allSites, connectionStatus }) {
  const stats = calculateSystemStats(allSites)

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