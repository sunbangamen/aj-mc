import React, { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { STATUS_COLORS, STATUS_LABELS, extractSensorsFromSiteData, parseSensorKey, getSensorDisplayName } from '../types/sensor'
import { SITE_STATUS_LABELS, SITE_STATUS_COLORS } from '../types/site'
import { useAlertSystem } from '../hooks/useAlertSystem'
import { computeRepresentativeStatus } from '../utils/representativeStatus'

const SiteCard = React.memo(function SiteCard({ siteId, siteData, siteName, siteStatus = 'active' }) {
  const { loadThresholds, loadSiteThresholds } = useAlertSystem()
  const [timeouts, setTimeouts] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = siteId ? await loadSiteThresholds(siteId) : await loadThresholds(null)
        if (mounted) setTimeouts(data)
      } catch {
        if (mounted) setTimeouts(null)
      }
    }
    load()
    return () => { mounted = false }
  }, [siteId])

  const { allSensors, statusColor, statusLabel, lastUpdate, causeKey } = useMemo(() => {
    const sensors = extractSensorsFromSiteData(siteData)

    if (siteStatus !== 'active') {
      return { allSensors: sensors, statusColor: STATUS_COLORS.offline, statusLabel: siteStatus === 'maintenance' ? '점검중' : '비활성', lastUpdate: '업데이트 없음' }
    }
    const rep = computeRepresentativeStatus(siteData, timeouts)
    return {
      allSensors: sensors,
      statusColor: STATUS_COLORS[rep.status],
      statusLabel: STATUS_LABELS[rep.status] || rep.status,
      lastUpdate: rep.timestamp ? new Date(rep.timestamp).toLocaleTimeString() : '업데이트 없음',
      causeKey: rep.causeKey,
    }
  }, [siteData, siteStatus, timeouts])

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
      <div className="status-badge" style={{ backgroundColor: statusColor, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {statusLabel}
        {statusLabel !== '정상' && causeKey && (() => {
          const parsed = parseSensorKey(causeKey)
          const label = parsed ? `${getSensorDisplayName(`${parsed.sensorType}`)} ${parsed.sensorNumber}` : causeKey
          return (
            <span
              className="rep-cause"
              title={`대표 상태 원인 센서: ${label}`}
              style={{ background: '#ffffff33', borderRadius: 10, padding: '2px 6px', fontSize: '0.75rem' }}
            >
              원인: {label}
            </span>
          )
        })()}
      </div>

      {allSensors.length > 0 ? (
        <div className="sensors-list">
          {allSensors.map(sensor => (
            <div key={sensor.key} className="sensor-item">
              <div className="sensor-main-info">
                <span className="sensor-name">{sensor.displayName}:</span>
                <span className="sensor-value">{sensor.value || '---'} {sensor.unit}</span>
                {sensor.location && (
                  <span className="sensor-location">📍 {sensor.location}</span>
                )}
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
