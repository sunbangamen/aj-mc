import React, { useState } from 'react'
import { useAlertSystem } from '../hooks/useAlertSystem'

/**
 * 개발용 알림 히스토리 관리 컴포넌트
 * Firebase alerts/history에 쌓인 데이터를 개발 중에 빠르게 정리할 수 있음
 */
function DevAlertHistoryManager() {
  const {
    deleteAllHistory,
    deleteAllActiveAlerts,
    clearCache,
    manualCleanup,
    getSystemStatus
  } = useAlertSystem()

  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [systemStatus, setSystemStatus] = useState(null)

  // 시스템 상태 새로고침
  const refreshStatus = () => {
    const status = getSystemStatus()
    setSystemStatus(status)
    console.log('📊 시스템 상태:', status)
  }

  // 모든 히스토리 삭제
  const handleDeleteAllHistory = async () => {
    if (!window.confirm('⚠️ 정말로 모든 알림 히스토리를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await deleteAllHistory()
      setLastResult(result)

      if (result.success) {
        alert('✅ 모든 히스토리가 삭제되었습니다!')
        refreshStatus()
      } else {
        alert(`❌ 삭제 실패: ${result.error}`)
      }
    } catch (error) {
      alert(`❌ 오류 발생: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 모든 활성 알림 삭제
  const handleDeleteActiveAlerts = async () => {
    if (!window.confirm('⚠️ 정말로 모든 활성 알림을 삭제하시겠습니까?')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await deleteAllActiveAlerts()
      setLastResult(result)

      if (result.success) {
        alert('✅ 모든 활성 알림이 삭제되었습니다!')
        refreshStatus()
      } else {
        alert(`❌ 삭제 실패: ${result.error}`)
      }
    } catch (error) {
      alert(`❌ 오류 발생: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 캐시 초기화
  const handleClearCache = () => {
    const result = clearCache()
    setLastResult(result)
    alert(`🧹 캐시 초기화 완료: ${result.cleared}개 항목 제거`)
    refreshStatus()
  }

  // 30일 이상 된 데이터만 정리
  const handleSmartCleanup = async () => {
    setIsLoading(true)
    try {
      const result = await manualCleanup()
      setLastResult(result)

      alert(`🧹 스마트 정리 완료!\n히스토리: ${result.historyResult.deleted}개 삭제\n캐시: ${result.cacheResult}개 정리`)
      refreshStatus()
    } catch (error) {
      alert(`❌ 오류 발생: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="dev-alert-manager">
      <div className="panel-header">
        <h3>🛠️ 개발용 알림 히스토리 관리</h3>
        <button
          onClick={refreshStatus}
          className="btn btn-outline btn-sm"
          disabled={isLoading}
        >
          📊 상태 새로고침
        </button>
      </div>

      {/* 시스템 상태 표시 */}
      {systemStatus && (
        <div className="status-display">
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">캐시 크기:</span>
              <span className="status-value">{systemStatus.cache.cacheSize}개</span>
            </div>
            <div className="status-item">
              <span className="status-label">활성 알림:</span>
              <span className="status-value">{systemStatus.alerts.active}개</span>
            </div>
            <div className="status-item">
              <span className="status-label">전체 알림:</span>
              <span className="status-value">{systemStatus.alerts.total}개</span>
            </div>
          </div>
        </div>
      )}

      {/* 정리 버튼들 */}
      <div className="cleanup-actions">
        <div className="action-group">
          <h4>🧹 안전한 정리</h4>
          <button
            onClick={handleSmartCleanup}
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? '정리 중...' : '30일 이상 된 데이터 정리'}
          </button>
          <p className="action-description">
            30일 이상 된 히스토리만 삭제합니다. (권장)
          </p>
        </div>

        <div className="action-group">
          <h4>⚡ 빠른 정리</h4>
          <button
            onClick={handleClearCache}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            캐시 초기화
          </button>
          <p className="action-description">
            메모리 캐시만 초기화합니다. (안전함)
          </p>
        </div>

        <div className="action-group danger">
          <h4>🚨 전체 삭제 (주의!)</h4>
          <div className="danger-buttons">
            <button
              onClick={handleDeleteAllHistory}
              className="btn btn-danger"
              disabled={isLoading}
            >
              {isLoading ? '삭제 중...' : '모든 히스토리 삭제'}
            </button>
            <button
              onClick={handleDeleteActiveAlerts}
              className="btn btn-danger"
              disabled={isLoading}
            >
              {isLoading ? '삭제 중...' : '모든 활성 알림 삭제'}
            </button>
          </div>
          <p className="action-description danger-text">
            ⚠️ 모든 데이터가 영구적으로 삭제됩니다. 개발용으로만 사용하세요!
          </p>
        </div>
      </div>

      {/* 마지막 결과 표시 */}
      {lastResult && (
        <div className="last-result">
          <h4>마지막 작업 결과</h4>
          <pre>{JSON.stringify(lastResult, null, 2)}</pre>
        </div>
      )}

    </div>
  )
}

export default DevAlertHistoryManager