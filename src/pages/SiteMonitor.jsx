import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSiteSensorData } from '../hooks/useSensorData'
import { useSite } from '../hooks/useSiteManagement'
import { STATUS_COLORS, STATUS_LABELS, extractSensorsFromSiteData, getLegacySensorData } from '../types/sensor'
import { useAlertSystem } from '../hooks/useAlertSystem'
import MeasurementTable from '../components/MeasurementTable'
import SensorChart from '../components/SensorChart'
import HardwareStatusPanel from '../components/HardwareStatusPanel'
import AlertBanner from '../components/AlertBanner'

function SiteMonitor() {
  const { siteId } = useParams()
  const { sensorData, loading, error, connectionStatus } =
    useSiteSensorData(siteId)
  const {
    site,
    loading: siteLoading,
    error: siteError
  } = useSite(siteId === 'test' ? null : siteId) // 테스트 사이트는 사이트 정보를 가져오지 않음

  // Phase 14E: 알림 시스템 (사이트별 필터링)
  const {
    alerts,
    acknowledgeAlert,
    deleteAlert,
    loadSiteThresholds,
    thresholds
  } = useAlertSystem()

  // 사이트별 임계값 상태
  const [siteThresholds, setSiteThresholds] = React.useState({})
  const [thresholdsLoaded, setThresholdsLoaded] = React.useState(false)

  // 사이트별 임계값 로드
  React.useEffect(() => {
    let mounted = true

    const loadThresholds = async () => {
      console.log('SiteMonitor 임계값 로딩 시작:', siteId)

      if (siteId && loadSiteThresholds) {
        try {
          const loadedThresholds = await loadSiteThresholds(siteId)
          if (mounted) {
            console.log('SiteMonitor 사이트별 임계값 로드 완료:', loadedThresholds)
            setSiteThresholds(loadedThresholds)
            setThresholdsLoaded(true)
          }
        } catch (error) {
          if (mounted) {
            console.error('사이트 임계값 로드 오류:', error)
            setSiteThresholds(thresholds) // 기본값 사용
            setThresholdsLoaded(true)
          }
        }
      } else if (mounted) {
        console.log('SiteMonitor 기본 임계값 사용')
        setSiteThresholds(thresholds)
        setThresholdsLoaded(true)
      }
    }

    loadThresholds()

    return () => {
      mounted = false
    }
  }, [siteId]) // loadSiteThresholds와 thresholds 제거

  // 기본 임계값이 변경될 때만 별도로 처리
  React.useEffect(() => {
    if (!siteId && Object.keys(thresholds).length > 0) {
      setSiteThresholds(thresholds)
      setThresholdsLoaded(true)
    }
  }, [thresholds, siteId])

  // 현재 사이트의 알림만 필터링
  const siteAlerts = alerts.filter(alert => alert.siteId === siteId)

  // 사이트 이름 가져오기 (동적)
  const getSiteName = () => {
    if (site?.name) return site.name
    if (siteId === 'test') return '테스트 현장'
    return siteId || '알 수 없는 현장'
  }

  if (loading || (siteLoading && siteId !== 'test')) {
    return (
      <div className="site-monitor">
        <h1>{getSiteName()} 모니터링</h1>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || (siteError && siteId !== 'test')) {
    return (
      <div className="site-monitor">
        <h1>{getSiteName()} 모니터링</h1>
        <div className="error-message">
          <h3>❌ 연결 오류</h3>
          <p>{error || siteError}</p>
          <Link to="/">← 대시보드로 돌아가기</Link>
        </div>
      </div>
    )
  }

  if (!sensorData) {
    return (
      <div className="site-monitor">
        <h1>{getSiteName()} 모니터링</h1>
        <div className="no-data">
          <p>해당 현장의 데이터가 없습니다.</p>
          <Link to="/">← 대시보드로 돌아가기</Link>
        </div>
      </div>
    )
  }

  // 다중 센서 데이터 처리
  const allSensors = extractSensorsFromSiteData(sensorData)
  const primarySensor = getLegacySensorData(sensorData)

  // 주 센서가 없으면 첫 번째 센서 사용
  const mainSensor = primarySensor || (allSensors.length > 0 ? allSensors[0].data : null)

  if (!mainSensor) {
    return (
      <div className="site-monitor">
        <h1>{getSiteName()} 모니터링</h1>
        <div className="no-data">
          <p>해당 현장의 센서 데이터가 없습니다.</p>
          <Link to="/">← 대시보드로 돌아가기</Link>
        </div>
      </div>
    )
  }

  const statusColor = STATUS_COLORS[mainSensor.status] || STATUS_COLORS.offline
  const statusLabel = STATUS_LABELS[mainSensor.status] || STATUS_LABELS.offline
  const lastUpdate = new Date(mainSensor.timestamp).toLocaleString()

  return (
    <div className="site-monitor">
      <div className="site-header">
        <Link to="/" className="back-link">
          ← 대시보드
        </Link>
        <h1>{getSiteName()} 모니터링</h1>
        <div className="connection-status">
          <span className={`status-indicator ${connectionStatus}`}>
            {connectionStatus === 'connected'
              ? '🟢 실시간 연결'
              : '🔴 연결 안됨'}
          </span>
        </div>
      </div>

      {/* Phase 14E: 사이트별 활성 알림 */}
      <AlertBanner
        alerts={siteAlerts}
        onAcknowledge={acknowledgeAlert}
        onDismiss={deleteAlert}
        compact={false}
      />

      {/* 사이트별 임계값 정보 */}
      {thresholdsLoaded && (
        <div className="site-thresholds-panel">
          <div className="panel-header">
            <h3>📊 현재 임계값 설정</h3>
            <Link to={`/admin?tab=thresholds&siteId=${siteId}`} className="btn btn-sm btn-outline">
              ⚙️ 설정 변경
            </Link>
          </div>
          <div className="thresholds-grid">
            {Object.entries(siteThresholds && Object.keys(siteThresholds).length > 0 ? siteThresholds : thresholds).map(([sensorType, config]) => {
              const sensorName = {
                ultrasonic: '초음파',
                temperature: '온도',
                humidity: '습도',
                pressure: '압력'
              }[sensorType] || sensorType

              const sensorUnit = {
                ultrasonic: 'cm',
                temperature: '°C',
                humidity: '%',
                pressure: 'hPa'
              }[sensorType] || ''

              return (
                <div key={sensorType} className="threshold-info-card">
                  <h4>{sensorName} 센서</h4>
                  <div className="threshold-ranges">
                    <div className="range-item warning">
                      <span className="range-label">⚠️ 경고</span>
                      <span className="range-value">
                        {config.warning.min} ~ {config.warning.max} {sensorUnit}
                      </span>
                    </div>
                    <div className="range-item alert">
                      <span className="range-label">🚨 위험</span>
                      <span className="range-value">
                        {config.alert.min} ~ {config.alert.max} {sensorUnit}
                      </span>
                    </div>
                    <div className="range-item timeout">
                      <span className="range-label">📵 오프라인</span>
                      <span className="range-value">
                        {Math.round(config.offline_timeout / 1000)}초 초과
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 다중 센서 표시 */}
      {allSensors.length > 1 && (
        <div className="multi-sensor-overview">
          <h2>📊 전체 센서 현황 ({allSensors.length}개)</h2>
          <div className="sensors-grid">
            {allSensors.map((sensor) => (
              <div key={sensor.key} className="mini-sensor-card">
                <h4>{sensor.displayName}</h4>
                <div className="sensor-value-display">
                  <span style={{ color: STATUS_COLORS[sensor.data.status] || STATUS_COLORS.offline }}>
                    {sensor.value || '---'} {sensor.unit}
                  </span>
                </div>
                <div className="mini-status-badge" style={{
                  backgroundColor: STATUS_COLORS[sensor.data.status] || STATUS_COLORS.offline
                }}>
                  {STATUS_LABELS[sensor.data.status] || STATUS_LABELS.offline}
                </div>
                {sensor.location && (
                  <p className="sensor-location">📍 {sensor.location}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="site-info-grid">
        <div className="current-data">
          <h2>
            {allSensors.length > 1 ? '주요 센서 데이터' : '현재 센서 데이터'}
            {mainSensor.location && (
              <span className="sensor-location"> ({mainSensor.location})</span>
            )}
          </h2>
          <div className="distance-display">
            <span className="distance-value" style={{ color: statusColor }}>
              {mainSensor.distance || mainSensor.value || '---'}
              {mainSensor.distance ? ' cm' : (mainSensor.value ? ' °C' : '')}
            </span>
          </div>
          <div
            className="status-badge large"
            style={{ backgroundColor: statusColor }}
          >
            {statusLabel}
          </div>
          <p className="last-update">마지막 업데이트: {lastUpdate}</p>
          {mainSensor.deviceId && (
            <p className="device-info">디바이스: {mainSensor.deviceId}</p>
          )}
        </div>

        <div className="sensor-info-section">
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
        </div>
      </div>

      {/* 센서별 차트 및 테이블 섹션 */}
      {allSensors.length > 0 ? (
        <div className="sensors-monitoring-section">
          <h2>📊 센서별 상세 모니터링</h2>
          {allSensors.map((sensor, index) => (
            <div key={sensor.key} className="individual-sensor-section">
              <div className="sensor-section-header">
                <h3>
                  {sensor.displayName}
                  <span className="sensor-location">({sensor.location})</span>
                </h3>
                <div className="sensor-current-status">
                  <span
                    className="status-indicator"
                    style={{
                      backgroundColor: STATUS_COLORS[sensor.data?.status || 'offline'],
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    {STATUS_LABELS[sensor.data?.status || 'offline']}
                  </span>
                  <span className="current-value">
                    현재: {sensor.value || '---'} {sensor.unit}
                  </span>
                </div>
              </div>

              {/* 개별 센서 차트 */}
              <SensorChart
                siteId={siteId}
                sensorKey={sensor.key}
                sensorData={sensor.data}
                limit={20}
                height={300}
                connectionStatus={connectionStatus}
                sensorName={sensor.displayName}
              />

              {/* Phase 14D: 하드웨어 상태 정보 패널 */}
              <HardwareStatusPanel
                sensorData={sensor.data}
                sensorKey={sensor.key}
              />

              {/* 개별 센서 측정 이력 테이블 */}
              <MeasurementTable
                siteId={siteId}
                sensorKey={sensor.key}
                sensorData={sensor.data}
                limit={15}
                connectionStatus={connectionStatus}
                sensorName={sensor.displayName}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="no-sensors-monitoring">
          <h3>📊 센서 모니터링</h3>
          <p>표시할 센서 데이터가 없습니다.</p>
          <p>센서 데이터가 올바른 형식으로 Firebase에 저장되어 있는지 확인해주세요.</p>
        </div>
      )}
    </div>
  )
}

export default SiteMonitor
