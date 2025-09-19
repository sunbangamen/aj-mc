import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  getLegacySensorData,
  extractSensorsFromSiteData,
} from '../types/sensor'
import { SITE_STATUS_LABELS, SITE_STATUS_COLORS } from '../types/site'

const SiteCard = React.memo(function SiteCard({ siteId, siteData, siteName, siteStatus = 'active' }) {
  const { primarySensor, allSensors, statusColor, statusLabel, lastUpdate } = useMemo(() => {
    const primary = getLegacySensorData(siteData)
    const sensors = extractSensorsFromSiteData(siteData)
    const color = STATUS_COLORS[primary?.status || 'offline']
    const label = STATUS_LABELS[primary?.status || 'offline']
    const last = primary?.timestamp
      ? new Date(primary.timestamp).toLocaleTimeString()
      : '업데이트 없음'
    return {
      primarySensor: primary,
      allSensors: sensors,
      statusColor: color,
      statusLabel: label,
      lastUpdate: last,
    }
  }, [siteData])

  return (
    <Link to={`/site/${siteId}`} className="site-card" style={siteStatus !== 'active' ? { opacity: 0.85 } : undefined}>
      <h3>
        {siteName}
        {siteStatus !== 'active' && (
          <span
            className="site-status-badge"
            style={{
              marginLeft: 8,
              fontSize: '0.8rem',
              padding: '2px 8px',
              borderRadius: 12,
              backgroundColor: SITE_STATUS_COLORS[siteStatus] || '#95a5a6',
              color: '#fff'
            }}
          >
            {SITE_STATUS_LABELS[siteStatus] || siteStatus}
          </span>
        )}
      </h3>
      <div className="status-badge" style={{ backgroundColor: statusColor }}>
        {statusLabel}
      </div>

      {allSensors.length > 0 ? (
        <div className="sensors-list">
          {allSensors.map(sensor => (
            <div key={sensor.key} className="sensor-item">
              <div className="sensor-main-info">
                <span className="sensor-name">{sensor.displayName}:</span>
                <span className="sensor-value">{sensor.value || '---'} {sensor.unit}</span>
              </div>
              {sensor.data && (
                <div className="sensor-hw-status">
                  {sensor.data.batteryLevel !== undefined && (
                    <span className={`hw-indicator ${sensor.data.batteryLevel >= 30 ? 'good' : 'warning'}`}>
                      🔋 {sensor.data.batteryLevel}%
                    </span>
                  )}
                  {sensor.data.signalStrength !== undefined && (
                    <span className={`hw-indicator ${sensor.data.signalStrength >= -60 ? 'good' : 'warning'}`}>
                      📶 {sensor.data.signalStrength >= -40 ? '강함' : sensor.data.signalStrength >= -60 ? '보통' : '약함'}
                    </span>
                  )}
                  {sensor.data.errorCount !== undefined && sensor.data.errorCount > 0 && (
                    <span className="hw-indicator error">⚠️ 오류 {sensor.data.errorCount}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-sensors">
          <span className="no-data-text">센서 데이터 없음</span>
        </div>
      )}

      {allSensors.length > 0 && (
        <div className="sensors-count">
          <span className="sensor-badge">📊 센서 {allSensors.length}개</span>
        </div>
      )}

      <p className="last-update">마지막 업데이트: {lastUpdate}</p>
    </Link>
  )
})

export default SiteCard
