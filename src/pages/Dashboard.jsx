import React from 'react'
import { Link } from 'react-router-dom'
import { useAllSensorData } from '../hooks/useSensorData'
import { STATUS_COLORS, STATUS_LABELS } from '../types/sensor'

function Dashboard() {
  const { allSites, loading, error, connectionStatus } = useAllSensorData()

  if (loading) {
    return (
      <div className="dashboard">
        <h1>관제모니터링 시스템</h1>
        <p>데이터를 불러오는 중...</p>
        <div className="loading-indicator">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard">
        <h1>관제모니터링 시스템</h1>
        <div className="error-message">
          <h3>❌ 연결 오류</h3>
          <p>{error}</p>
          <p>Firebase 설정을 확인해주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <h1>관제모니터링 시스템</h1>
      <div className="connection-status">
        <span className={`status-indicator ${connectionStatus}`}>
          {connectionStatus === 'connected' ? '🟢 연결됨' : '🔴 연결 안됨'}
        </span>
        <p>모든 현장의 실시간 센서 데이터를 확인합니다.</p>
      </div>

      <div className="sites-overview">
        {allSites.length === 0 ? (
          <div className="no-data">
            <p>센서 데이터가 없습니다.</p>
            <p>Firebase에 테스트 데이터를 추가해주세요.</p>
          </div>
        ) : (
          allSites.map(({ siteId, ultrasonic }) => {
            const statusColor = STATUS_COLORS[ultrasonic?.status || 'offline']
            const statusLabel = STATUS_LABELS[ultrasonic?.status || 'offline']
            const lastUpdate = ultrasonic?.timestamp
              ? new Date(ultrasonic.timestamp).toLocaleTimeString()
              : '업데이트 없음'

            return (
              <Link key={siteId} to={`/site/${siteId}`} className="site-card">
                <h3>
                  {siteId === 'site1'
                    ? '현장 1'
                    : siteId === 'site2'
                      ? '현장 2'
                      : siteId === 'test'
                        ? '테스트'
                        : siteId}
                </h3>
                <div
                  className="status-badge"
                  style={{ backgroundColor: statusColor }}
                >
                  {statusLabel}
                </div>
                <div className="distance-info">
                  <span className="distance">
                    {ultrasonic?.distance || '---'} cm
                  </span>
                </div>
                <p className="last-update">마지막 업데이트: {lastUpdate}</p>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Dashboard
