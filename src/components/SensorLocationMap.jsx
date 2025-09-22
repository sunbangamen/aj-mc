import React from 'react'
import { STATUS_COLORS, STATUS_LABELS } from '../types/sensor'
import SensorLocationEditor from './SensorLocationEditor'
import '../styles/SensorLocationEditor.css'

/**
 * 현장별 센서 위치 맵 컴포넌트 (CSS Grid 기반)
 * Phase 10A: 센서 위치 시각화 시스템
 */
const SensorLocationMap = ({ sensors, siteId, onSensorClick, onLocationUpdate }) => {
  // 센서가 없으면 표시하지 않음
  if (!sensors || sensors.length === 0) {
    return (
      <div className="sensor-location-map-empty">
        <p>📍 표시할 센서가 없습니다.</p>
      </div>
    )
  }

  // 센서 타입별 그룹화
  const sensorsByType = sensors.reduce((acc, sensor) => {
    const type = sensor.type
    if (!acc[type]) acc[type] = []
    acc[type].push(sensor)
    return acc
  }, {})

  // 센서 클릭 핸들러
  const handleSensorClick = (sensor) => {
    if (onSensorClick) {
      onSensorClick(sensor)
    }
  }

  return (
    <div className="sensor-location-map">
      <div className="map-header">
        <h3>📍 센서 위치 맵</h3>
        <div className="sensor-count-info">
          총 {sensors.length}개 센서
        </div>
      </div>

      {/* 센서 타입별 범례 */}
      <div className="sensor-legend">
        {Object.entries(sensorsByType).map(([type, typeSensors]) => {
          const typeNames = {
            ultrasonic: '초음파',
            temperature: '온도',
            humidity: '습도',
            pressure: '압력'
          }
          return (
            <div key={type} className="legend-item">
              <span className="legend-icon" data-type={type}>
                {typeNames[type] || type}
              </span>
              <span className="legend-count">({typeSensors.length}개)</span>
            </div>
          )
        })}
      </div>

      {/* 상태별 범례 */}
      <div className="status-legend">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="status-legend-item">
            <div
              className="status-color-dot"
              style={{ backgroundColor: color }}
            />
            <span>{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>

      {/* CSS Grid 기반 센서 맵 */}
      <div className="sensor-grid-container">
        <div className="sensor-grid">
          {sensors.map((sensor) => (
            <SensorTile
              key={sensor.key}
              sensor={sensor}
              siteId={siteId}
              onClick={() => handleSensorClick(sensor)}
              onLocationUpdate={onLocationUpdate}
            />
          ))}
        </div>
      </div>

    </div>
  )
}

/**
 * 개별 센서 타일 컴포넌트 (React.memo로 최적화)
 */
const SensorTile = React.memo(({ sensor, siteId, onClick, onLocationUpdate, compact = false }) => {
  const statusColor = STATUS_COLORS[sensor.data?.status] || STATUS_COLORS.offline
  const statusLabel = STATUS_LABELS[sensor.data?.status] || STATUS_LABELS.offline

  // 센서 값과 단위
  const displayValue = sensor.value || '---'
  const unit = sensor.unit || ''

  // 센서 타입별 아이콘
  const getTypeIcon = (type) => {
    switch (type) {
      case 'ultrasonic': return '🔊'
      case 'temperature': return '🌡️'
      case 'humidity': return '💧'
      case 'pressure': return '📊'
      default: return '📡'
    }
  }

  return (
    <div
      className={`sensor-tile ${compact ? 'compact' : ''} ${sensor.data?.status || 'offline'}`}
      style={{
        '--status-color': statusColor,
        backgroundColor: `${statusColor}15`,
        borderLeft: `4px solid ${statusColor}`
      }}
      onClick={onClick}
      title={`${sensor.displayName} - ${statusLabel}: ${displayValue} ${unit}`}
    >
      <div className="sensor-tile-header">
        <span className="sensor-icon">{getTypeIcon(sensor.type)}</span>
        <span className="sensor-name">{sensor.displayName}</span>
        <div
          className="sensor-status-dot"
          style={{ backgroundColor: statusColor }}
        />
      </div>

      <div className="sensor-tile-body">
        <div className="sensor-value">
          <span className="value">{displayValue}</span>
          <span className="unit">{unit}</span>
        </div>

        <SensorLocationEditor
          siteId={siteId}
          sensorKey={sensor.key}
          currentLocation={sensor.location}
          onLocationUpdate={onLocationUpdate}
          compact={compact}
        />

        {!compact && (
          <div className="sensor-status-badge" style={{ color: statusColor }}>
            {statusLabel}
          </div>
        )}
      </div>

      {/* 알림 상태 표시 */}
      {(sensor.data?.status === 'alert' || sensor.data?.status === 'warning') && (
        <div className="sensor-alert-indicator">
          {sensor.data?.status === 'alert' ? '🚨' : '⚠️'}
        </div>
      )}

      {/* 오프라인 표시 */}
      {sensor.data?.status === 'offline' && (
        <div className="sensor-offline-indicator">
          📵
        </div>
      )}
    </div>
  )
})

SensorTile.displayName = 'SensorTile'

export default SensorLocationMap