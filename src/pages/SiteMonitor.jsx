import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSiteSensorData } from '../hooks/useSensorData'
import { STATUS_COLORS, STATUS_LABELS } from '../types/sensor'

function SiteMonitor() {
  const { siteId } = useParams()
  const { sensorData, loading, error, connectionStatus } =
    useSiteSensorData(siteId)

  const getSiteName = id => {
    switch (id) {
      case 'site1':
        return '현장 1'
      case 'site2':
        return '현장 2'
      case 'test':
        return '테스트'
      default:
        return id
    }
  }

  if (loading) {
    return (
      <div className="site-monitor">
        <h1>{getSiteName(siteId)} 모니터링</h1>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="site-monitor">
        <h1>{getSiteName(siteId)} 모니터링</h1>
        <div className="error-message">
          <h3>❌ 연결 오류</h3>
          <p>{error}</p>
          <Link to="/">← 대시보드로 돌아가기</Link>
        </div>
      </div>
    )
  }

  if (!sensorData) {
    return (
      <div className="site-monitor">
        <h1>{getSiteName(siteId)} 모니터링</h1>
        <div className="no-data">
          <p>해당 현장의 데이터가 없습니다.</p>
          <Link to="/">← 대시보드로 돌아가기</Link>
        </div>
      </div>
    )
  }

  const statusColor = STATUS_COLORS[sensorData.status] || STATUS_COLORS.offline
  const statusLabel = STATUS_LABELS[sensorData.status] || STATUS_LABELS.offline
  const lastUpdate = new Date(sensorData.timestamp).toLocaleString()

  return (
    <div className="site-monitor">
      <div className="site-header">
        <Link to="/" className="back-link">
          ← 대시보드
        </Link>
        <h1>{getSiteName(siteId)} 모니터링</h1>
        <div className="connection-status">
          <span className={`status-indicator ${connectionStatus}`}>
            {connectionStatus === 'connected'
              ? '🟢 실시간 연결'
              : '🔴 연결 안됨'}
          </span>
        </div>
      </div>

      <div className="current-data">
        <h2>현재 거리값</h2>
        <div className="distance-display">
          <span className="distance-value" style={{ color: statusColor }}>
            {sensorData.distance} cm
          </span>
        </div>
        <div
          className="status-badge large"
          style={{ backgroundColor: statusColor }}
        >
          {statusLabel}
        </div>
        <p className="last-update">마지막 업데이트: {lastUpdate}</p>
      </div>

      <div className="recent-logs">
        <h3>센서 정보</h3>
        <div className="sensor-info">
          <div className="info-item">
            <label>현재 거리:</label>
            <span>{sensorData.distance} cm</span>
          </div>
          <div className="info-item">
            <label>상태:</label>
            <span style={{ color: statusColor }}>{statusLabel}</span>
          </div>
          <div className="info-item">
            <label>업데이트 시간:</label>
            <span>{lastUpdate}</span>
          </div>
        </div>

        {sensorData.history && (
          <div className="history-section">
            <h4>측정 이력</h4>
            <p>이력 데이터가 있으면 여기에 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SiteMonitor
