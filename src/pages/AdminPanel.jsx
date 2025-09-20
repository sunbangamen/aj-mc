import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAlertSystem } from '../hooks/useAlertSystem'
import { useSimulation } from '../contexts/SimulationContext'
import { useSiteManagement, useSites } from '../hooks/useSiteManagement'
import ThresholdConfig from '../components/ThresholdConfig'
import AlertManager from '../components/AlertManager'
import HardwareMetadataPanel from '../components/HardwareMetadataPanel'
import DevAlertHistoryManager from '../components/DevAlertHistoryManager'

/**
 * Phase 14E: 관리자 패널
 * 임계값 설정, 경고 관리, 시뮬레이션 제어 통합 인터페이스
 */
const AdminPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'alerts') // alerts, thresholds, simulation, hardware, history
  const [showThresholdConfig, setShowThresholdConfig] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState(searchParams.get('siteId') || null) // 사이트별 임계값 설정용
  const [siteThresholds, setSiteThresholds] = useState({})

  // 경고 시스템 훅
  const {
    alerts,
    alertStats,
    thresholds,
    isLoading: alertsLoading,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    deleteAlert,
    deleteAllAlerts,
    saveThresholds,
    loadSiteThresholds
  } = useAlertSystem()

  // 사이트 목록 훅(이름 매핑용)
  const { sites, loading: sitesLoading } = useSites()
  const siteNames = React.useMemo(() => {
    const map = {}
    sites.forEach(s => { if (s?.id) map[s.id] = s.name || s.id })
    return map
  }, [sites])

  // 시뮬레이션 컨텍스트
  const {
    isRunning,
    simulationConfig,
    simulationStats,
    startSimulation,
    stopSimulation,
    updateConfig,
    setAllSensorsStatus,
    availableModes,
    availableStatuses,
    cleanupAllSensorKeys
  } = useSimulation()

  const handleThresholdSave = async (newThresholds) => {
    const success = await saveThresholds(newThresholds, selectedSiteId)
    if (success) {
      setShowThresholdConfig(false)
      // 사이트별 임계값 리로드
      if (selectedSiteId) {
        const updatedThresholds = await loadSiteThresholds(selectedSiteId)
        setSiteThresholds(updatedThresholds)
      }
    }
    return success
  }

  const handleSiteSelect = async (siteId) => {
    console.log('사이트 선택:', siteId)
    setSelectedSiteId(siteId)

    // URL 업데이트
    const newParams = new URLSearchParams(searchParams)
    if (siteId) {
      newParams.set('siteId', siteId)
      const loadedThresholds = await loadSiteThresholds(siteId)
      setSiteThresholds(loadedThresholds)
      console.log('사이트별 임계값 로드:', loadedThresholds)
    } else {
      newParams.delete('siteId')
      setSiteThresholds(thresholds) // 전역 설정 사용
    }
    setSearchParams(newParams)
  }

  // URL 매개변수 처리
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    const siteParam = searchParams.get('siteId')

    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }

    if (siteParam && siteParam !== selectedSiteId) {
      console.log('사이트 파라미터 처리:', siteParam)
      setSelectedSiteId(siteParam)
      // thresholds 탭으로 자동 이동 (아직 설정되지 않은 경우)
      if (!tabParam) {
        setActiveTab('thresholds')
      }
      // 비동기로 사이트 임계값 로드
      if (loadSiteThresholds) {
        loadSiteThresholds(siteParam).then(loadedThresholds => {
          setSiteThresholds(loadedThresholds)
          console.log('사이트별 임계값 로드 완료:', loadedThresholds)
        }).catch(error => {
          console.error('사이트 임계값 로드 오류:', error)
          setSiteThresholds(thresholds)
        })
      }
    }
  }, [searchParams])

  // 기본 임계값 설정
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteThresholds(thresholds)
    }
  }, [thresholds, selectedSiteId])

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (newTab) => {
    setActiveTab(newTab)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', newTab)
    setSearchParams(newParams)
  }

  const handleSimulationModeChange = (mode) => {
    updateConfig({ mode })
  }

  const handleSimulationIntervalChange = (interval) => {
    updateConfig({ interval: parseInt(interval) })
  }

  const tabs = [
    { id: 'alerts', name: '🚨 경고 관리', description: '활성 경고 확인 및 관리' },
    { id: 'thresholds', name: '📊 임계값 설정', description: '센서별 경고 임계값 설정' },
    { id: 'hardware', name: '🔧 하드웨어 관리', description: '센서 하드웨어 메타데이터 관리' },
    { id: 'simulation', name: '🎮 시뮬레이션 제어', description: '센서 데이터 시뮬레이션 관리' },
    { id: 'history', name: '🗑️ 히스토리 관리', description: '개발용 알림 히스토리 삭제 도구' }
  ]

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🔧 관리자 패널</h1>
        <p>시스템 설정 및 경고 관리</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <div className="tab-name">{tab.name}</div>
            <div className="tab-description">{tab.description}</div>
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="admin-content">
        {/* 경고 관리 탭 */}
        {activeTab === 'alerts' && (
          <div className="tab-content">
            <AlertManager
              alerts={alerts}
              alertStats={alertStats}
              onAcknowledge={acknowledgeAlert}
              onAcknowledgeAll={acknowledgeAllAlerts}
              onDelete={deleteAlert}
              onDeleteAll={deleteAllAlerts}
              isLoading={alertsLoading}
              siteNames={siteNames}
            />
          </div>
        )}

        {/* 임계값 설정 탭 */}
        {activeTab === 'thresholds' && (
          <div className="tab-content">
            {sitesLoading && (
              <div className="loading-message">
                <div className="loading-spinner">⏳ 사이트 정보 로딩 중...</div>
              </div>
            )}
            {!sitesLoading && showThresholdConfig ? (
              <ThresholdConfig
                thresholds={selectedSiteId ? (siteThresholds && Object.keys(siteThresholds).length > 0 ? siteThresholds : thresholds) : thresholds}
                onSave={handleThresholdSave}
                onCancel={() => setShowThresholdConfig(false)}
                siteId={selectedSiteId}
                siteName={selectedSiteId ? ((sites || []).find(s => s.id === selectedSiteId)?.name || selectedSiteId) : '전역 기본값'}
              />
            ) : !sitesLoading ? (
              <div className="threshold-overview">
                <div className="overview-header">
                  <h3>📊 임계값 설정 관리</h3>
                  <div className="site-selector">
                    <label>설정 범위:</label>
                    <select
                      value={selectedSiteId || ''}
                      onChange={(e) => handleSiteSelect(e.target.value || null)}
                      className="site-select"
                    >
                      <option value="">전역 기본값</option>
                      {(sites || []).map(site => (
                        <option key={site.id} value={site.id}>
                          📍 {site.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowThresholdConfig(true)}
                  >
                    ⚙️ 설정 변경
                  </button>
                </div>

                <div className="current-scope">
                  <p>
                    <strong>현재 표시 중:</strong>
                    {selectedSiteId ? (
                      <span className="scope-site">
                        📍 {(sites || []).find(s => s.id === selectedSiteId)?.name || selectedSiteId} 현장 전용 설정
                      </span>
                    ) : (
                      <span className="scope-global">
                        🌍 모든 현장 공통 기본값
                      </span>
                    )}
                  </p>
                </div>

                <div className="threshold-summary">
                  {Object.entries(selectedSiteId ? (siteThresholds && Object.keys(siteThresholds).length > 0 ? siteThresholds : thresholds) : thresholds).map(([sensorType, config]) => (
                    <div key={sensorType} className="threshold-card">
                      <h4>
                        {sensorType === 'ultrasonic' ? '초음파' :
                         sensorType === 'temperature' ? '온도' :
                         sensorType === 'humidity' ? '습도' :
                         sensorType === 'pressure' ? '압력' : sensorType}
                        센서
                      </h4>
                      <div className="threshold-values">
                        <div className="threshold-range warning">
                          <span className="label">⚠️ 경고:</span>
                          <span className="range">
                            {config.warning.min} ~ {config.warning.max}
                            {sensorType === 'ultrasonic' ? 'cm' :
                             sensorType === 'temperature' ? '°C' :
                             sensorType === 'humidity' ? '%' :
                             sensorType === 'pressure' ? 'hPa' : ''}
                          </span>
                        </div>
                        <div className="threshold-range alert">
                          <span className="label">🚨 위험:</span>
                          <span className="range">
                            {config.alert.min} ~ {config.alert.max}
                            {sensorType === 'ultrasonic' ? 'cm' :
                             sensorType === 'temperature' ? '°C' :
                             sensorType === 'humidity' ? '%' :
                             sensorType === 'pressure' ? 'hPa' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* 하드웨어 관리 탭 */}
        {activeTab === 'hardware' && (
          <div className="tab-content">
            <HardwareMetadataPanel />
          </div>
        )}

        {/* 시뮬레이션 제어 탭 */}
        {activeTab === 'simulation' && (
          <div className="tab-content">
            <div className="simulation-control">
              <div className="control-header">
                <h3>🎮 센서 데이터 시뮬레이션</h3>
                <div className="simulation-status">
                  <span className={`status-indicator ${isRunning ? 'running' : 'stopped'}`}>
                    {isRunning ? '🟢 실행 중' : '🔴 중지됨'}
                  </span>
                </div>
              </div>

              {/* 시뮬레이션 통계 */}
              <div className="simulation-stats">
                <div className="stat-card">
                  <div className="stat-value">{simulationConfig.sites.length}</div>
                  <div className="stat-label">시뮬레이션 사이트</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{simulationStats.totalUpdates}</div>
                  <div className="stat-label">총 업데이트 수</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{simulationStats.averageProcessingTime}ms</div>
                  <div className="stat-label">평균 처리 시간</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{simulationStats.errors}</div>
                  <div className="stat-label">오류 수</div>
                </div>
              </div>

              {/* 시뮬레이션 제어 */}
              <div className="simulation-controls">
                <div className="control-group">
                  <label>시뮬레이션 모드:</label>
                  <select
                    value={simulationConfig.mode}
                    onChange={(e) => handleSimulationModeChange(e.target.value)}
                    disabled={isRunning}
                  >
                    {availableModes.map(mode => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="control-group">
                  <label>업데이트 간격 (초):</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={simulationConfig.interval / 1000}
                    onChange={(e) => handleSimulationIntervalChange(e.target.value * 1000)}
                    disabled={isRunning}
                  />
                </div>

                <div className="control-buttons">
                  <button
                    className={`btn ${isRunning ? 'btn-danger' : 'btn-success'}`}
                    onClick={isRunning ? stopSimulation : startSimulation}
                  >
                    {isRunning ? '⏹️ 시뮬레이션 중지' : '▶️ 시뮬레이션 시작'}
                  </button>
                </div>
              </div>

              {/* 빠른 테스트 */}
              <div className="quick-test">
                <h4>🎯 빠른 테스트</h4>
                <p>모든 센서를 특정 상태로 일시 설정</p>
                <div className="test-buttons">
                  {availableStatuses.map(status => (
                    <button
                      key={status}
                      className={`btn btn-sm test-btn ${status}`}
                      onClick={() => setAllSensorsStatus(status)}
                    >
                      {status === 'normal' ? '✅ 정상' :
                       status === 'warning' ? '⚠️ 경고' :
                       status === 'alert' ? '🚨 위험' :
                       status === 'offline' ? '📵 오프라인' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* 센서 키 정리 도구 */}
              <div className="sensor-cleanup">
                <h4>🧹 센서 키 정리</h4>
                <p>중복된 센서 키를 정리합니다 (ultrasonic_1과 ultrasonic_01이 동시에 있는 경우)</p>
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    if (confirm('모든 현장의 중복/레거시 센서 키를 정리하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
                      cleanupAllSensorKeys()
                    }
                  }}
                >
                  🧹 중복 센서 키 정리
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 히스토리 관리 탭 */}
        {activeTab === 'history' && (
          <div className="admin-content">
            <DevAlertHistoryManager />
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel
