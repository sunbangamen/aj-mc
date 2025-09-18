import React from 'react'
import { Link } from 'react-router-dom'
import { useAllSensorData } from '../hooks/useSensorData'
import { useSites } from '../hooks/useSiteManagement'
import { STATUS_COLORS, STATUS_LABELS, getLegacySensorData, extractSensorsFromSiteData, getSensorValue, getSensorUnit } from '../types/sensor'
import SystemStatsCards from '../components/SystemStatsCards'
import RecentEventsPanel from '../components/RecentEventsPanel'
import SystemStatusPanel from '../components/SystemStatusPanel'
import QuickActionsPanel from '../components/QuickActionsPanel'

function Dashboard() {
  const { allSites, loading, error, connectionStatus } = useAllSensorData()
  const { sites } = useSites()

  // 사이트 이름 가져오기 함수
  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId)
    if (site?.name) return site.name
    if (siteId === 'test') return '테스트 현장'
    return siteId || '알 수 없는 현장'
  }

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
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        모든 현장의 실시간 센서 데이터를 확인합니다.
      </p>

      {/* 시스템 통계 카드 */}
      <SystemStatsCards
        allSites={allSites}
        connectionStatus={connectionStatus}
      />

      {/* 최근 이벤트 패널 */}
      <RecentEventsPanel allSites={allSites} />

      {/* 시스템 상태 패널 */}
      <SystemStatusPanel />

      {/* 빠른 액션 패널 */}
      <QuickActionsPanel onRefresh={() => window.location.reload()} />

      <div className="sites-overview">
        {allSites.length === 0 ? (
          <div className="no-data">
            <p>센서 데이터가 없습니다.</p>
            <p>Firebase에 테스트 데이터를 추가해주세요.</p>
          </div>
        ) : (
          allSites.map(({ siteId, ...siteData }) => {
            // 하위 호환성: 기존 ultrasonic 데이터 또는 새로운 다중 센서 구조 지원
            const primarySensor = getLegacySensorData(siteData)
            const allSensors = extractSensorsFromSiteData(siteData)

            const statusColor = STATUS_COLORS[primarySensor?.status || 'offline']
            const statusLabel = STATUS_LABELS[primarySensor?.status || 'offline']
            const lastUpdate = primarySensor?.timestamp
              ? new Date(primarySensor.timestamp).toLocaleTimeString()
              : '업데이트 없음'

            return (
              <Link key={siteId} to={`/site/${siteId}`} className="site-card">
                <h3>{getSiteName(siteId)}</h3>
                <div
                  className="status-badge"
                  style={{ backgroundColor: statusColor }}
                >
                  {statusLabel}
                </div>

                {/* 센서별 리스트 표시 */}
                {allSensors.length > 0 ? (
                  <div className="sensors-list">
                    {allSensors.map((sensor, index) => (
                      <div key={sensor.key} className="sensor-item">
                        <span className="sensor-name">
                          {sensor.displayName}:
                        </span>
                        <span className="sensor-value">
                          {sensor.value || '---'} {sensor.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-sensors">
                    <span className="no-data-text">센서 데이터 없음</span>
                  </div>
                )}

                {/* 센서 개수 표시 */}
                {allSensors.length > 0 && (
                  <div className="sensors-count">
                    <span className="sensor-badge">
                      📊 센서 {allSensors.length}개
                    </span>
                  </div>
                )}

                {/* 레거시: 추가 센서 간략 표시는 제거 */}
                {false && (
                  <div className="additional-sensors">
                    {allSensors.slice(1, 4).map(sensor => (
                      <div key={sensor.key} className="mini-sensor">
                        <span className="sensor-name">{sensor.displayName}:</span>
                        <span className="sensor-value">
                          {sensor.value || '---'} {sensor.unit}
                        </span>
                      </div>
                    ))}
                    {allSensors.length > 4 && (
                      <div className="more-sensors">+{allSensors.length - 4}개 더</div>
                    )}
                  </div>
                )}

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
