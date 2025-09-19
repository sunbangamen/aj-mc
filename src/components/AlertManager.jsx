import React, { useState } from 'react'
import { formatAlertMessage, ALERT_TYPES } from '../utils/alertSystem'

/**
 * Phase 14E: 경고 관리 컴포넌트
 * 활성 경고 목록, 확인, 삭제 기능 제공
 */
const AlertManager = ({
  alerts,
  alertStats,
  onAcknowledge,
  onAcknowledgeAll,
  onDelete,
  onDeleteAll,
  isLoading,
  siteNames = {}
}) => {
  const [filter, setFilter] = useState('all') // all, active, acknowledged
  const [sortBy, setSortBy] = useState('timestamp') // timestamp, priority, type

  // 필터링된 경고 목록
  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'active':
        return !alert.acknowledged
      case 'acknowledged':
        return alert.acknowledged
      default:
        return true
    }
  })

  // 중복 제거된 필터링된 경고 목록
  const uniqueFilteredAlerts = filteredAlerts.filter((alert, index, self) =>
    index === self.findIndex(a => a.id === alert.id)
  )

  // 정렬된 경고 목록
  const sortedAlerts = [...uniqueFilteredAlerts].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        return a.priority - b.priority
      case 'type':
        return a.type.localeCompare(b.type)
      case 'timestamp':
      default:
        return b.timestamp - a.timestamp
    }
  })

  const getAlertTypeInfo = (alertType) => {
    return Object.values(ALERT_TYPES).find(type => type.level === alertType) || ALERT_TYPES.THRESHOLD_WARNING
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // siteId를 사람이 읽는 현장명으로 치환
  const resolveSiteName = (id) => (siteNames && siteNames[id]) || id

  if (isLoading) {
    return (
      <div className="alert-manager loading">
        <div className="loading-spinner">⏳ 경고 데이터 로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="alert-manager">
      {/* 헤더 및 통계 */}
      <div className="alert-header">
        <div className="header-title">
          <h3>🚨 경고 관리</h3>
          <div className="alert-stats">
            <span className="stat-item total">
              전체: {alertStats.total}
            </span>
            <span className="stat-item active">
              활성: {alertStats.active}
            </span>
            <span className="stat-item acknowledged">
              확인: {alertStats.acknowledged}
            </span>
          </div>
        </div>

        <div className="header-actions">
          {alertStats.active > 0 && (
            <button
              className="btn btn-warning"
              onClick={onAcknowledgeAll}
            >
              ✅ 모든 경고 확인
            </button>
          )}
          {alertStats.total > 0 && (
            <button
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm(`정말로 모든 ${alertStats.total}개의 경고를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
                  if (typeof onDeleteAll === 'function') {
                    onDeleteAll()
                  }
                }
              }}
              title="모든 경고를 완전히 삭제합니다"
            >
              🗑️ 전체 삭제
            </button>
          )}
        </div>
      </div>

      {/* 필터 및 정렬 */}
      <div className="alert-controls">
        <div className="filter-controls">
          <label>필터:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">전체 경고</option>
            <option value="active">활성 경고</option>
            <option value="acknowledged">확인된 경고</option>
          </select>
        </div>

        <div className="sort-controls">
          <label>정렬:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="timestamp">시간순</option>
            <option value="priority">우선순위</option>
            <option value="type">타입별</option>
          </select>
        </div>
      </div>

      {/* 경고 목록 */}
      <div className="alert-list">
        {sortedAlerts.length === 0 ? (
          <div className="no-alerts">
            <div className="no-alerts-icon">🔕</div>
            <p>
              {filter === 'active' ? '활성 경고가 없습니다.' :
               filter === 'acknowledged' ? '확인된 경고가 없습니다.' :
               '경고가 없습니다.'}
            </p>
          </div>
        ) : (
          sortedAlerts.map(alert => {
            const typeInfo = getAlertTypeInfo(alert.type)
            return (
              <div
                key={alert.id}
                className={`alert-item ${alert.type} ${alert.acknowledged ? 'acknowledged' : 'active'}`}
              >
                <div className="alert-icon">
                  {typeInfo.icon}
                </div>

                <div className="alert-content">
                  <div className="alert-header-row">
                    <div className="alert-site">
                      📍 {resolveSiteName(alert.siteId)} / {alert.sensorKey}
                    </div>
                    <div className="alert-timestamp">
                      {formatTimestamp(alert.timestamp)}
                    </div>
                  </div>

                  <div className="alert-message">
                    {formatAlertMessage(alert)}
                  </div>

                  <div className="alert-details">
                    <span className={`alert-type ${alert.type}`}>
                      {alert.type.toUpperCase()}
                    </span>
                    <span className="alert-priority">
                      우선순위: {alert.priority}
                    </span>
                    {alert.acknowledged && (
                      <span className="alert-acknowledged">
                        ✅ 확인됨 ({formatTimestamp(alert.acknowledgedAt)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="alert-actions">
                  {!alert.acknowledged ? (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => onAcknowledge(alert.id)}
                      title="경고 확인"
                    >
                      ✅
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => onDelete(alert.id)}
                      title="경고 삭제"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}

export default AlertManager
