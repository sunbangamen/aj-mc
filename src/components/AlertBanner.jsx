/**
 * Phase 14E: 알림 배너 컴포넌트
 * Dashboard와 SiteMonitor에서 활성 알림을 표시
 */

import React, { useState } from 'react'
import { ALERT_TYPES } from '../utils/alertSystem'

const AlertBanner = ({ alerts, onAcknowledge, onDismiss, compact = false }) => {
  const [minimized, setMinimized] = useState(false)

  // 활성 알림만 필터링 (확인되지 않은 알림)
  const activeAlerts = alerts.filter(alert => !alert.acknowledged)

  // 중복 제거 및 우선순위별 정렬 (높은 우선순위 = 낮은 숫자)
  const uniqueAlerts = activeAlerts.filter((alert, index, self) =>
    index === self.findIndex(a => a.id === alert.id)
  )
  const sortedAlerts = [...uniqueAlerts].sort((a, b) => a.priority - b.priority)

  if (uniqueAlerts.length === 0) return null

  // 가장 높은 우선순위 알림
  const topAlert = sortedAlerts[0]
  const alertType = Object.values(ALERT_TYPES).find(type => type.level === topAlert.type) || ALERT_TYPES.THRESHOLD_WARNING

  const formatAlertMessage = (alert) => {
    let message = alert.message
    if (alert.data?.value !== undefined) {
      message += ` (${alert.data.value}${alert.data.unit || ''})`
    }
    if (alert.data?.batteryLevel !== undefined) {
      message += ` (${alert.data.batteryLevel}%)`
    }
    if (alert.data?.signalStrength !== undefined) {
      message += ` (${alert.data.signalStrength}dBm)`
    }
    return message
  }

  const formatTimestamp = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    return new Date(timestamp).toLocaleDateString('ko-KR')
  }

  if (compact) {
    // 축약 모드 (Dashboard용)
    return (
      <div className={`alert-banner compact`} style={{ backgroundColor: `${alertType.color}15`, borderLeft: `4px solid ${alertType.color}` }}>
        <div className="alert-content">
          <div className="alert-header">
            <span className="alert-icon" style={{ color: alertType.color }}>
              {alertType.icon}
            </span>
            <span className="alert-count" style={{ color: alertType.color }}>
              {uniqueAlerts.length}개의 활성 알림
              {uniqueAlerts.length > 10 && (
                <span className="urgent-notice" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                  (긴급 확인 필요)
                </span>
              )}
            </span>
          </div>
          {!minimized && (
            <div className="alert-details">
              <div className="alert-message">
                <strong>최우선 알림:</strong> {topAlert.siteId}/{topAlert.sensorKey} - {formatAlertMessage(topAlert)}
              </div>
              {uniqueAlerts.length > 3 && (
                <div className="alert-summary" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  상위 3개 알림 외에 {uniqueAlerts.length - 3}개의 추가 알림이 있습니다.
                  <a
                    href="/admin"
                    style={{
                      marginLeft: '0.5rem',
                      color: alertType.color,
                      textDecoration: 'underline',
                      fontWeight: '500'
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      window.location.href = '/admin'
                    }}
                  >
                    관리자 패널에서 전체 확인 →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="alert-actions">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('펼치기/접기 버튼 클릭:', !minimized)
              setMinimized(!minimized)
            }}
            className="alert-action-btn toggle"
            title={minimized ? '펼치기 (상세 정보 보기)' : '접기 (요약만 보기)'}
          >
            {minimized ? '▼ 펼치기' : '▲ 접기'}
          </button>
          {uniqueAlerts.length > 10 && (
            <button
              onClick={(e) => {
                e.preventDefault()
                window.location.href = '/admin'
              }}
              className="alert-action-btn manage"
              title="관리자 패널에서 전체 알림 관리"
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: '1px solid #3b82f6'
              }}
            >
              🔧 관리
            </button>
          )}
          {onDismiss && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('알림 삭제됨:', topAlert.id)
                onDismiss(topAlert.id)
              }}
              className="alert-action-btn dismiss"
              title="최우선 알림 삭제"
            >
              ✕ 삭제
            </button>
          )}
        </div>
      </div>
    )
  }

  // 전체 모드 (SiteMonitor용)
  return (
    <div className="alert-banner-list">
      {sortedAlerts.slice(0, 3).map((alert) => {
        const currentAlertType = Object.values(ALERT_TYPES).find(type => type.level === alert.type) || ALERT_TYPES.THRESHOLD_WARNING

        return (
          <div
            key={alert.id}
            className="alert-banner"
            style={{ backgroundColor: `${currentAlertType.color}15`, borderLeft: `4px solid ${currentAlertType.color}` }}
          >
            <div className="alert-content">
              <div className="alert-header">
                <span className="alert-icon" style={{ color: currentAlertType.color }}>
                  {currentAlertType.icon}
                </span>
                <span className="alert-title" style={{ color: currentAlertType.color }}>
                  {alert.type === 'alert' ? '위험' : alert.type === 'warning' ? '경고' : '정보'}
                </span>
                <span className="alert-time">
                  {formatTimestamp(alert.timestamp)}
                </span>
              </div>
              <div className="alert-message">
                <strong>{alert.sensorKey}</strong>: {formatAlertMessage(alert)}
              </div>
            </div>
            <div className="alert-actions">
              {onAcknowledge && (
                <button
                  onClick={() => {
                    console.log('알림 확인됨:', alert.id)
                    onAcknowledge(alert.id)
                  }}
                  className="alert-action-btn acknowledge"
                  title="확인 (알림을 확인했다고 표시)"
                >
                  ✓ 확인
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={() => {
                    console.log('알림 삭제됨:', alert.id)
                    onDismiss(alert.id)
                  }}
                  className="alert-action-btn dismiss"
                  title="삭제 (알림을 완전히 제거)"
                >
                  ✕ 삭제
                </button>
              )}
            </div>
          </div>
        )
      })}

      {uniqueAlerts.length > 3 && (
        <div className="alert-banner more-alerts">
          <span className="more-count">
            +{uniqueAlerts.length - 3}개의 추가 알림이 있습니다
          </span>
        </div>
      )}
    </div>
  )
}

export default AlertBanner