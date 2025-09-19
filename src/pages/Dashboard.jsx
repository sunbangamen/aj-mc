import React from 'react'
import { Link } from 'react-router-dom'
import { useAllSensorData } from '../hooks/useSensorData'
import { useSites } from '../hooks/useSiteManagement'
import { useAlertSystem } from '../hooks/useAlertSystem'
import { STATUS_COLORS, STATUS_LABELS, getLegacySensorData, extractSensorsFromSiteData, getSensorValue, getSensorUnit } from '../types/sensor'
import SystemStatsCards from '../components/SystemStatsCards'
import RecentEventsPanel from '../components/RecentEventsPanel'
import SystemStatusPanel from '../components/SystemStatusPanel'
import QuickActionsPanel from '../components/QuickActionsPanel'
import AlertBanner from '../components/AlertBanner'
import SiteCard from '../components/SiteCard'

function Dashboard() {
  const { allSites, loading, error, connectionStatus } = useAllSensorData()
  const { sites } = useSites()

  // Phase 14E: 알림 시스템
  const {
    alerts,
    acknowledgeAlert,
    deleteAlert
  } = useAlertSystem()

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

      {/* Phase 14E: 활성 알림 배너 */}
      <AlertBanner
        alerts={alerts}
        onAcknowledge={acknowledgeAlert}
        onDismiss={deleteAlert}
        compact={true}
      />

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
            const siteName = getSiteName(siteId)
            return (
              <SiteCard key={siteId} siteId={siteId} siteData={siteData} siteName={siteName} />
            )
          })
        )}
      </div>
    </div>
  )
}

export default Dashboard
