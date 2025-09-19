/**
 * 하드웨어 상태 정보 표시 패널 (Phase 14D)
 * 반응형 그리드 레이아웃으로 간결하게 재구성
 */

import React from 'react'
import { formatDateTime } from '../types/sensor.js'

const HardwareStatusPanel = React.memo(({ sensorData, sensorKey }) => {
  if (!sensorData) {
    return (
      <div className="hardware-panel empty">
        <h4>하드웨어 상태</h4>
        <p>데이터 없음</p>
      </div>
    )
  }

  // 색상 헬퍼
  const batteryColor = (level) => (level >= 60 ? '#16a34a' : level >= 30 ? '#ca8a04' : '#dc2626')
  const signalColor = (dbm) => (dbm >= -40 ? '#16a34a' : dbm >= -60 ? '#ca8a04' : '#dc2626')
  const reliabilityText = (r) => ({ high: '높음', medium: '보통', low: '낮음' }[r] || r)

  return (
    <div className="hardware-panel">
      <div className="hardware-header">
        <h4>하드웨어 상태 정보</h4>
        <span className="sensor-key">{sensorKey}</span>
      </div>

      {/* 기본 하드웨어 지표 */}
      <div className="hardware-grid">
        {sensorData.batteryLevel !== undefined && (
          <div className="metric-card">
            <div className="metric-row">
              <span className="metric-title">배터리</span>
              <span className="metric-value">{sensorData.batteryLevel}%</span>
            </div>
            <div className="progress">
              <div
                className="fill"
                style={{ width: `${Math.max(0, Math.min(100, sensorData.batteryLevel))}%`, backgroundColor: batteryColor(sensorData.batteryLevel) }}
              />
            </div>
          </div>
        )}

        {sensorData.signalStrength !== undefined && (
          <div className="metric-card">
            <div className="metric-row">
              <span className="metric-title">WiFi 신호</span>
              <span className="metric-value" style={{ color: signalColor(sensorData.signalStrength) }}>
                {sensorData.signalStrength >= -40 ? '강함' : sensorData.signalStrength >= -60 ? '보통' : '약함'}
              </span>
            </div>
            <div className="metric-sub">{sensorData.signalStrength} dBm</div>
          </div>
        )}

        {sensorData.firmwareVersion && (
          <div className="metric-card">
            <div className="metric-row">
              <span className="metric-title">펌웨어</span>
              <span className="metric-value">{sensorData.firmwareVersion}</span>
            </div>
          </div>
        )}

        {sensorData.hardwareModel && (
          <div className="metric-card">
            <div className="metric-row">
              <span className="metric-title">모델</span>
              <span className="metric-value">{sensorData.hardwareModel}</span>
            </div>
          </div>
        )}
      </div>

      {/* 품질 지표 */}
      <div className="hardware-grid small-gap">
        {sensorData.accuracy !== undefined && (
          <div className="metric-pill">
            <span className="pill-name">정확도</span>
            <span className="pill-value">{sensorData.accuracy}%</span>
          </div>
        )}
        {sensorData.reliability && (
          <div className="metric-pill">
            <span className="pill-name">신뢰도</span>
            <span className="pill-value">{reliabilityText(sensorData.reliability)}</span>
          </div>
        )}
        {sensorData.errorCount !== undefined && (
          <div className="metric-pill">
            <span className="pill-name">오류</span>
            <span className="pill-value" style={{ color: sensorData.errorCount === 0 ? '#16a34a' : '#dc2626' }}>
              {sensorData.errorCount}
            </span>
          </div>
        )}
      </div>

      {/* 유지보수 정보 */}
      <div className="maintenance-grid">
        {sensorData.installDate && (
          <div className="kv">
            <span className="k">설치일</span>
            <span className="v">{formatDateTime(sensorData.installDate)}</span>
          </div>
        )}
        {sensorData.lastMaintenance && (
          <div className="kv">
            <span className="k">마지막 점검</span>
            <span className="v">{formatDateTime(sensorData.lastMaintenance)}</span>
          </div>
        )}
        {sensorData.calibrationDate && (
          <div className="kv">
            <span className="k">교정일</span>
            <span className="v">{formatDateTime(sensorData.calibrationDate)}</span>
          </div>
        )}
        {sensorData.warrantyExpire && (
          <div className="kv">
            <span className="k">보증 만료</span>
            <span className="v" style={{ color: sensorData.warrantyExpire < Date.now() ? '#dc2626' : sensorData.warrantyExpire < Date.now() + 30 * 24 * 60 * 60 * 1000 ? '#ca8a04' : '#16a34a' }}>
              {formatDateTime(sensorData.warrantyExpire)}
            </span>
          </div>
        )}
        {sensorData.deviceId && (
          <div className="kv wide">
            <span className="k">디바이스 ID</span>
            <span className="v mono">{sensorData.deviceId}</span>
          </div>
        )}
        {sensorData.location && (
          <div className="kv wide">
            <span className="k">설치 위치</span>
            <span className="v">{sensorData.location}</span>
          </div>
        )}
      </div>
    </div>
  )
})

export default HardwareStatusPanel
