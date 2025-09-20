import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSiteSensorData } from '../hooks/useSensorData'
import { useSite } from '../hooks/useSiteManagement'
import { STATUS_COLORS, STATUS_LABELS, extractSensorsFromSiteData, getLegacySensorData } from '../types/sensor'
import { useAlertSystem } from '../hooks/useAlertSystem'
import { debug } from '../utils/log'
import MeasurementTable from '../components/MeasurementTable'
import SensorChart from '../components/SensorChart'
import HardwareStatusPanel from '../components/HardwareStatusPanel'
import AlertBanner from '../components/AlertBanner'
import SensorLocationMap from '../components/SensorLocationMap'
import SensorLocationEditor from '../components/SensorLocationEditor'
import '../styles/SensorLocationMap.css'

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

  // thresholds를 useRef로 관리하여 무한 루프 방지
  const thresholdsRef = React.useRef(thresholds)
  React.useEffect(() => {
    thresholdsRef.current = thresholds
  }, [thresholds])

  // 사이트별 임계값 로드 (useCallback으로 최적화)
  const loadThresholds = React.useCallback(async (mounted) => {
    debug('SiteMonitor 임계값 로딩 시작:', siteId)

    if (siteId && loadSiteThresholds) {
      try {
        const loadedThresholds = await loadSiteThresholds(siteId)
        if (mounted.current) {
          debug('SiteMonitor 사이트별 임계값 로드 완료:', loadedThresholds)
          setSiteThresholds(loadedThresholds)
          setThresholdsLoaded(true)
        }
      } catch (error) {
        if (mounted.current) {
          console.error('사이트 임계값 로드 오류:', error)
          setSiteThresholds(thresholdsRef.current) // 기본값 사용
          setThresholdsLoaded(true)
        }
      }
    } else if (mounted.current) {
      debug('SiteMonitor 기본 임계값 사용')
      setSiteThresholds(thresholdsRef.current)
      setThresholdsLoaded(true)
    }
  }, [siteId, loadSiteThresholds])

  React.useEffect(() => {
    const mounted = { current: true }
    loadThresholds(mounted)

    return () => {
      mounted.current = false
    }
  }, [loadThresholds])


  // 현재 사이트의 알림만 필터링
  const siteAlerts = alerts.filter(alert => alert.siteId === siteId)

  // 센서 위치 업데이트 핸들러
  const handleLocationUpdate = (sensorKey, newLocation) => {
    debug(`📍 센서 위치 업데이트: ${sensorKey} → ${newLocation}`)
    // 실시간 데이터가 자동으로 반영되므로 별도 처리 불필요
    // useSiteSensorData 훅이 Firebase 변경사항을 자동으로 감지합니다
  }

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
  debug('🔍 [SiteMonitor] sensorData:', sensorData)
  const allSensors = extractSensorsFromSiteData(sensorData)
  debug('🔍 [SiteMonitor] allSensors:', allSensors)
  debug('🔍 [SiteMonitor] allSensors 키들:', allSensors.map(s => s.key))
  debug('🔍 [SiteMonitor] allSensors 개수:', allSensors.length)
  const primarySensor = getLegacySensorData(sensorData)
  debug('🔍 [SiteMonitor] primarySensor:', primarySensor)

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
            <Link
              to={`/admin?tab=thresholds&siteId=${siteId}`}
              className="btn btn-sm btn-primary"
              style={{ backgroundColor: '#3b82f6', color: 'white', border: '1px solid #3b82f6' }}
            >
              ⚙️ 설정 변경
            </Link>
          </div>
          <div className="thresholds-grid">
            {(() => {
              // 현재 사이트에서 실제 사용 중인 센서 타입 추출
              const activeSensorTypes = new Set()

              // allSensors에서 센서 타입 추출
              allSensors.forEach(sensor => {
                const sensorType = sensor.key.split('_')[0] // ultrasonic_1 -> ultrasonic
                activeSensorTypes.add(sensorType)
              })

              // 기존 단일 센서 지원 (legacy)
              if (sensorData?.distance !== undefined) {
                activeSensorTypes.add('ultrasonic')
              }
              if (sensorData?.temperature !== undefined) {
                activeSensorTypes.add('temperature')
              }
              if (sensorData?.humidity !== undefined) {
                activeSensorTypes.add('humidity')
              }
              if (sensorData?.pressure !== undefined) {
                activeSensorTypes.add('pressure')
              }

              const currentThresholds = siteThresholds && Object.keys(siteThresholds).length > 0 ? siteThresholds : thresholds

              // 활성 센서 타입과 임계값이 모두 있는 센서만 표시
              return Array.from(activeSensorTypes).filter(sensorType =>
                currentThresholds[sensorType]
              ).map(sensorType => {
                const config = currentThresholds[sensorType]
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
              })
            })()}
          </div>
        </div>
      )}

      {/* 센서 위치 맵 */}
      {allSensors.length > 0 && (
        <SensorLocationMap
          sensors={allSensors}
          siteId={siteId}
          onSensorClick={(sensor) => {
            // 센서 클릭 시 해당 센서 섹션으로 스크롤
            const sensorSection = document.getElementById(`sensor-section-${sensor.key}`)
            if (sensorSection) {
              sensorSection.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          onLocationUpdate={handleLocationUpdate}
        />
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
      {(allSensors.length > 0 || sensorData) ? (
        <div className="sensors-monitoring-section">
          <h2>📊 센서별 상세 모니터링</h2>
          {allSensors.length > 0 ? (
            allSensors.map((sensor, index) => (
              <div key={sensor.key} className="individual-sensor-section" id={`sensor-section-${sensor.key}`}>
                <div className="sensor-section-header">
                  <h3>
                    {sensor.displayName}
                    <SensorLocationEditor
                      siteId={siteId}
                      sensorKey={sensor.key}
                      currentLocation={sensor.location}
                      onLocationUpdate={handleLocationUpdate}
                      compact={false}
                    />
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
                  siteId={siteId}
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
            ))
          ) : (
            // allSensors가 비어있지만 sensorData가 있는 경우의 폴백
            <div className="fallback-sensor-section">
              <h3>📊 기본 센서 모니터링</h3>
              <p>⚠️ 센서 추출 실패 - 기본 차트로 표시합니다.</p>
              <SensorChart
                siteId={siteId}
                sensorKey="primary"
                sensorData={mainSensor}
                limit={20}
                height={300}
                connectionStatus={connectionStatus}
                sensorName="기본 센서"
              />
              <MeasurementTable
                siteId={siteId}
                sensorKey="primary"
                sensorData={mainSensor}
                limit={15}
                connectionStatus={connectionStatus}
                sensorName="기본 센서"
              />
            </div>
          )}
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
