/**
 * 하드웨어 메타데이터 관리 패널 (Phase 14D)
 * 센서별 하드웨어 정보 편집 및 관리
 */

import React, { useState, useEffect } from 'react'
import { useAllSensorData } from '../hooks/useSensorData'
import { useSites } from '../hooks/useSiteManagement'
import { useSimulation } from '../contexts/SimulationContext'
import { extractSensorsFromSiteData, formatDateTime } from '../types/sensor.js'
import { useAlertSystem } from '../hooks/useAlertSystem'
import { DEFAULT_THRESHOLDS } from '../utils/alertSystem'

const HardwareMetadataPanel = () => {
  const { allSites, loading, error } = useAllSensorData()
  const { sites, loading: sitesLoading } = useSites()
  const { isRunning, updateSensorMetadata } = useSimulation()
  const [selectedSite, setSelectedSite] = useState('')
  const [selectedSensor, setSelectedSensor] = useState('')
  const [editingMetadata, setEditingMetadata] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // 임계값(offline_timeout) 관리
  const { loadThresholds, loadSiteThresholds, saveThresholds, thresholds } = useAlertSystem()
  const [timeoutConfig, setTimeoutConfig] = useState(DEFAULT_THRESHOLDS)
  const [timeoutLoading, setTimeoutLoading] = useState(true)
  const [timeoutError, setTimeoutError] = useState(null)

  // 사이트 정보 맵 생성
  const siteMap = {}
  sites.forEach(site => {
    siteMap[site.id] = site
  })

  // 전체 센서 정보 수집
  const allSensorsData = []
  allSites.forEach(({ siteId, ...siteData }) => {
    const sensors = extractSensorsFromSiteData(siteData)
    const site = siteMap[siteId]
    sensors.forEach(sensor => {
      allSensorsData.push({
        siteId,
        siteName: site ? site.name : siteId,
        sensorKey: sensor.key,
        sensorName: sensor.displayName,
        data: sensor.data
      })
    })
  })

  // 현장별로 필터링된 센서 데이터
  const filteredSensorsData = selectedSite
    ? allSensorsData.filter(sensor => sensor.siteId === selectedSite)
    : allSensorsData

  // 현장 목록
  const availableSites = [...new Set(allSensorsData.map(s => s.siteId))]
    .map(siteId => ({
      id: siteId,
      name: siteMap[siteId] ? siteMap[siteId].name : siteId
    }))

  // 선택된 현장에 존재하는 센서 타입 계산(전역이면 전체 타입)
  const activeTimeoutTypes = React.useMemo(() => {
    if (!selectedSite) return ['ultrasonic', 'temperature', 'humidity', 'pressure']
    const cfg = siteMap[selectedSite]?.sensorConfig
    if (cfg && typeof cfg === 'object') {
      const types = Object.entries(cfg)
        .filter(([, count]) => (parseInt(count, 10) || 0) > 0)
        .map(([t]) => t)
      if (types.length) return types
    }
    // fallback: 실제 데이터에서 감지
    const typesSet = new Set()
    filteredSensorsData.forEach(s => {
      const t = (s.sensorKey || '').split('_')[0]
      if (t) typesSet.add(t)
    })
    return typesSet.size > 0 ? Array.from(typesSet) : ['ultrasonic', 'temperature', 'humidity', 'pressure']
  }, [selectedSite, JSON.stringify(siteMap[selectedSite] || {}), JSON.stringify(filteredSensorsData.map(s => s.sensorKey))])

  const handleEditMetadata = (sensorInfo) => {
    setEditingMetadata({
      ...sensorInfo,
      editableData: {
        location: sensorInfo.data.location || '',
        hardwareModel: sensorInfo.data.hardwareModel || '',
        firmwareVersion: sensorInfo.data.firmwareVersion || '',
        installDate: sensorInfo.data.installDate || Date.now(),
        lastMaintenance: sensorInfo.data.lastMaintenance || Date.now(),
        calibrationDate: sensorInfo.data.calibrationDate || Date.now(),
        warrantyExpire: sensorInfo.data.warrantyExpire || (Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    })
    setIsEditing(true)
  }

  const handleSaveMetadata = async () => {
    try {
      if (updateSensorMetadata) {
        // 시뮬레이션 모드든 실제 모드든 Firebase에 저장
        const success = await updateSensorMetadata(
          editingMetadata.siteId,
          editingMetadata.sensorKey,
          editingMetadata.editableData
        )

        if (success) {
          const modeText = isRunning ? '(시뮬레이션 모드)' : '(실제 모드)'
          alert(`✅ 센서 정보가 업데이트되었습니다. ${modeText}`)
        } else {
          alert('❌ 업데이트 중 오류가 발생했습니다.')
          return
        }
      } else {
        // updateSensorMetadata 함수가 없는 경우
        console.log('메타데이터 저장 (함수 없음):', editingMetadata)
        alert('❌ 센서 메타데이터 업데이트 기능을 사용할 수 없습니다.')
        return
      }

      setIsEditing(false)
      setEditingMetadata(null)
    } catch (error) {
      console.error('메타데이터 저장 오류:', error)
      alert('❌ 저장 중 오류가 발생했습니다.')
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingMetadata(null)
  }

  const updateEditableData = (field, value) => {
    setEditingMetadata(prev => ({
      ...prev,
      editableData: {
        ...prev.editableData,
        [field]: value
      }
    }))
  }

  // 오프라인 임계값(offline_timeout) 로드
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setTimeoutLoading(true)
      setTimeoutError(null)
      try {
        const data = selectedSite
          ? await loadSiteThresholds(selectedSite)
          : await loadThresholds(null)
        if (!mounted) return
        setTimeoutConfig(data)
      } catch (e) {
        if (!mounted) return
        setTimeoutError(e?.message || '임계값 로드 오류')
      } finally {
        if (mounted) setTimeoutLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [selectedSite])

  const handleTimeoutChange = (sensorType, seconds) => {
    const ms = Math.max(10, Math.min(3600, parseInt(seconds || 0, 10))) * 1000
    setTimeoutConfig(prev => ({
      ...prev,
      [sensorType]: {
        ...prev[sensorType],
        offline_timeout: ms
      }
    }))
  }

  const saveTimeouts = async () => {
    const ok = await saveThresholds(timeoutConfig, selectedSite || null)
    if (ok) alert('✅ 오프라인 임계값이 저장되었습니다.')
    else alert('❌ 저장 중 오류가 발생했습니다.')
  }

  const resetTimeoutsToDefault = async () => {
    if (!confirm('현재 범위의 오프라인 임계값을 기본값으로 초기화할까요?')) return
    const base = DEFAULT_THRESHOLDS
    setTimeoutConfig(base)
    const ok = await saveThresholds(base, selectedSite || null)
    if (ok) alert('✅ 기본값으로 초기화되었습니다.')
  }

  // 하드웨어 상태 요약 통계 (필터링된 데이터 기준)
  const hardwareStats = {
    total: filteredSensorsData.length,
    lowBattery: filteredSensorsData.filter(s => s.data.batteryLevel < 30).length,
    weakSignal: filteredSensorsData.filter(s => s.data.signalStrength < -60).length,
    withErrors: filteredSensorsData.filter(s => s.data.errorCount > 0).length,
    needMaintenance: filteredSensorsData.filter(s => {
      const maintenanceThreshold = Date.now() - (90 * 24 * 60 * 60 * 1000) // 90일
      return s.data.lastMaintenance < maintenanceThreshold
    }).length
  }

  if (loading) return <div className="text-center py-4" style={{ color: '#000' }}>데이터 로딩 중...</div>
  if (error) return <div className="text-red-600 py-4" style={{ color: '#dc2626' }}>오류: {error}</div>

  return (
    <div className="hardware-metadata-panel">
      {/* 헤더 */}
      <div className="panel-header">
        <div className="header-info">
          <h2>🔧 센서 하드웨어 관리</h2>
          <p>센서 위치 및 하드웨어 정보 관리</p>
        </div>
        <div className="site-filter">
          <label>현장 선택:</label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="site-select"
          >
            <option value="">전체 현장</option>
            {availableSites.map(site => (
              <option key={site.id} value={site.id}>
                📍 {site.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 오프라인 판정 시간 설정 */}
      <div className="timeout-config card">
        <div className="card-header">
          <h3>📵 오프라인 판정 시간</h3>
          <div className="scope">현재 범위: {selectedSite ? `📍 ${siteMap[selectedSite]?.name || selectedSite}` : '🌍 전역 기본값'}</div>
        </div>
        {timeoutLoading ? (
          <div className="loading">임계값 로딩 중...</div>
        ) : timeoutError ? (
          <div className="error" style={{ color: '#dc2626' }}>오류: {timeoutError}</div>
        ) : (
          <div className="timeout-grid">
            {activeTimeoutTypes.map(type => (
              <div key={type} className="timeout-item">
                <label className="timeout-label">
                  {type === 'ultrasonic' ? '초음파' : type === 'temperature' ? '온도' : type === 'humidity' ? '습도' : '압력'}
                </label>
                <div className="timeout-input">
                  <input
                    type="number"
                    min={10}
                    max={3600}
                    value={Math.floor((timeoutConfig?.[type]?.offline_timeout || DEFAULT_THRESHOLDS?.[type]?.offline_timeout || 60000) / 1000)}
                    onChange={(e) => handleTimeoutChange(type, e.target.value)}
                  />
                  <span className="unit">초</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="timeout-actions">
          <button className="btn btn-secondary" onClick={resetTimeoutsToDefault}>🔄 기본값</button>
          <button className="btn btn-primary" onClick={saveTimeouts}>💾 저장</button>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">{hardwareStats.total}</div>
            <div className="stat-label">총 센서</div>
          </div>
        </div>
        <div className="stat-card battery">
          <div className="stat-icon">🔋</div>
          <div className="stat-info">
            <div className="stat-value">{hardwareStats.lowBattery}</div>
            <div className="stat-label">배터리 부족</div>
          </div>
        </div>
        <div className="stat-card signal">
          <div className="stat-icon">📶</div>
          <div className="stat-info">
            <div className="stat-value">{hardwareStats.weakSignal}</div>
            <div className="stat-label">신호 약함</div>
          </div>
        </div>
        <div className="stat-card error">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <div className="stat-value">{hardwareStats.withErrors}</div>
            <div className="stat-label">오류 발생</div>
          </div>
        </div>
        <div className="stat-card maintenance">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <div className="stat-value">{hardwareStats.needMaintenance}</div>
            <div className="stat-label">점검 필요</div>
          </div>
        </div>
      </div>

      {/* 편집 모달 */}
      {isEditing && editingMetadata && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h3>✏️ 센서 정보 편집</h3>
              <div className="sensor-info">
                <span className="sensor-name">{editingMetadata.sensorName}</span>
                <span className="site-name">{editingMetadata.siteName}</span>
                {isRunning && <span className="mode-badge">🎮 시뮬레이션 모드</span>}
              </div>
            </div>

            <div className="modal-content">
              <div className="form-group">
                <label>📍 설치 위치</label>
                <input
                  type="text"
                  value={editingMetadata.editableData.location}
                  onChange={(e) => updateEditableData('location', e.target.value)}
                  placeholder="예: 동쪽벽, 천장, 출입구"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🔧 하드웨어 모델</label>
                  <input
                    type="text"
                    value={editingMetadata.editableData.hardwareModel}
                    onChange={(e) => updateEditableData('hardwareModel', e.target.value)}
                    placeholder="예: HC-SR04, DHT22"
                  />
                </div>
                <div className="form-group">
                  <label>💿 펌웨어 버전</label>
                  <input
                    type="text"
                    value={editingMetadata.editableData.firmwareVersion}
                    onChange={(e) => updateEditableData('firmwareVersion', e.target.value)}
                    placeholder="예: v1.2.3"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>📅 설치일</label>
                  <input
                    type="date"
                    value={new Date(editingMetadata.editableData.installDate).toISOString().split('T')[0]}
                    onChange={(e) => updateEditableData('installDate', new Date(e.target.value).getTime())}
                  />
                </div>
                <div className="form-group">
                  <label>🔍 마지막 점검일</label>
                  <input
                    type="date"
                    value={new Date(editingMetadata.editableData.lastMaintenance).toISOString().split('T')[0]}
                    onChange={(e) => updateEditableData('lastMaintenance', new Date(e.target.value).getTime())}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleCancelEdit}>
                취소
              </button>
              <button className="btn-save" onClick={handleSaveMetadata}>
                💾 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 센서 카드 목록 */}
      <div className="sensors-grid">
        {filteredSensorsData.map((sensorInfo, index) => (
          <div key={`${sensorInfo.siteId}-${sensorInfo.sensorKey}`} className="sensor-card">
            <div className="sensor-header">
              <div className="sensor-title">
                <h3>{sensorInfo.sensorName}</h3>
                <div className="sensor-meta">
                  <span className="site-name">📍 {sensorInfo.siteName}</span>
                  <span className="location">{sensorInfo.data.location || '위치 미설정'}</span>
                </div>
              </div>
              <button
                className="edit-btn"
                onClick={() => handleEditMetadata(sensorInfo)}
                title="센서 정보 편집"
              >
                ✏️
              </button>
            </div>

            <div className="sensor-status">
              <div className="status-item">
                <div className="status-icon">🔋</div>
                <div className="status-info">
                  <span className="status-label">배터리</span>
                  <span className={`status-value ${
                    sensorInfo.data.batteryLevel >= 60 ? 'good' :
                    sensorInfo.data.batteryLevel >= 30 ? 'warning' : 'danger'
                  }`}>
                    {sensorInfo.data.batteryLevel}%
                  </span>
                </div>
              </div>

              <div className="status-item">
                <div className="status-icon">📶</div>
                <div className="status-info">
                  <span className="status-label">신호</span>
                  <span className={`status-value ${
                    sensorInfo.data.signalStrength >= -40 ? 'good' :
                    sensorInfo.data.signalStrength >= -60 ? 'warning' : 'danger'
                  }`}>
                    {sensorInfo.data.signalStrength >= -40 ? '강함' :
                     sensorInfo.data.signalStrength >= -60 ? '보통' : '약함'}
                  </span>
                </div>
              </div>

              {sensorInfo.data.errorCount > 0 && (
                <div className="status-item">
                  <div className="status-icon">⚠️</div>
                  <div className="status-info">
                    <span className="status-label">오류</span>
                    <span className="status-value danger">
                      {sensorInfo.data.errorCount}회
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="sensor-details">
              <div className="detail-item">
                <span className="detail-label">모델:</span>
                <span className="detail-value">{sensorInfo.data.hardwareModel || '미설정'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">마지막 점검:</span>
                <span className="detail-value">{formatDateTime(sensorInfo.data.lastMaintenance)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSensorsData.length === 0 && (
        <div className="no-data">
          <div className="no-data-icon">📊</div>
          <h3>센서 데이터 없음</h3>
          <p>{selectedSite ? '선택한 현장에 센서가 없습니다.' : '관리할 센서가 없습니다.'}</p>
        </div>
      )}
    </div>
  )
}

export default HardwareMetadataPanel
