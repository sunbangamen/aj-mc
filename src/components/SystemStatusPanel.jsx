import React, { useState, useEffect } from 'react'
import { useSimulation } from '../contexts/SimulationContext'

function SystemStatusPanel() {
  const {
    isRunning,
    simulationConfig,
    simulationStats
  } = useSimulation()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastSyncTime, setLastSyncTime] = useState(new Date())
  const [performanceStats, setPerformanceStats] = useState({
    firebaseResponseTime: 0,
    dataUpdateSuccessRate: 100,
    averageProcessingTime: 0,
    errorRate: 0
  })

  // 현재 시간 업데이트 (1초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 마지막 동기화 시간 업데이트
  useEffect(() => {
    if (simulationStats.lastUpdate) {
      setLastSyncTime(new Date())
    }
  }, [simulationStats.lastUpdate])

  // 성능 지표 계산
  useEffect(() => {
    // Firebase 응답 속도 (시뮬레이션)
    const responseTime = isRunning ?
      Math.floor(80 + Math.random() * 100) : // 80-180ms
      Math.floor(50 + Math.random() * 50)    // 50-100ms

    // 데이터 업데이트 성공률 계산
    const totalAttempts = simulationStats.totalUpdates + simulationStats.errors
    const successRate = totalAttempts > 0 ?
      ((simulationStats.totalUpdates / totalAttempts) * 100).toFixed(1) : 100

    // 평균 처리시간 (실제 측정값)
    const avgProcessingTime = simulationStats.averageProcessingTime || 0

    // 오류율 계산
    const errorRate = totalAttempts > 0 ?
      ((simulationStats.errors / totalAttempts) * 100).toFixed(1) : 0

    setPerformanceStats({
      firebaseResponseTime: responseTime,
      dataUpdateSuccessRate: parseFloat(successRate),
      averageProcessingTime: avgProcessingTime,
      errorRate: parseFloat(errorRate)
    })
  }, [simulationStats, simulationConfig, isRunning])

  // 동기화 시간 차이 계산
  const getSyncStatus = () => {
    const diffMs = currentTime - lastSyncTime
    const diffSeconds = Math.floor(diffMs / 1000)

    if (diffSeconds < 5) return { text: '실시간', status: 'active' }
    if (diffSeconds < 30) return { text: `${diffSeconds}초 전`, status: 'recent' }
    if (diffSeconds < 300) return { text: `${Math.floor(diffSeconds / 60)}분 전`, status: 'delayed' }
    return { text: '연결 안됨', status: 'offline' }
  }

  const syncStatus = getSyncStatus()

  // 시뮬레이션 모드 라벨 가져오기
  const getSimulationModeLabel = () => {
    const modes = {
      'random': '랜덤 모드',
      'scenario': '시나리오 모드',
      'gradual': '점진적 모드'
    }
    return modes[simulationConfig.mode] || simulationConfig.mode
  }

  // 업데이트 주기 포맷
  const getUpdateInterval = () => {
    const seconds = simulationConfig.interval / 1000
    return `${seconds}초마다`
  }

  return (
    <div className="system-status-panel">
      <div className="status-header">
        <h3>⚡ 시스템 상태</h3>
        <div className="status-indicator">
          <div className={`indicator-dot ${syncStatus.status}`}></div>
          <span className="indicator-text">{syncStatus.text}</span>
        </div>
      </div>

      <div className="status-grid">
        {/* 데이터 업데이트 */}
        <div className="status-item">
          <div className="status-icon">📊</div>
          <div className="status-content">
            <div className="status-label">데이터 업데이트</div>
            <div className="status-value">
              {isRunning ? getUpdateInterval() : '중지됨'}
            </div>
          </div>
        </div>

        {/* 시뮬레이션 상태 */}
        <div className="status-item">
          <div className="status-icon">
            {isRunning ? '🟢' : '⚫'}
          </div>
          <div className="status-content">
            <div className="status-label">시뮬레이션</div>
            <div className="status-value">
              {isRunning ? (
                <>
                  실행 중 ({simulationConfig.sites.length}개 현장)
                  <br />
                  <small>{getSimulationModeLabel()}</small>
                </>
              ) : '중지됨'}
            </div>
          </div>
        </div>

        {/* 마지막 동기화 */}
        <div className="status-item">
          <div className="status-icon">🔄</div>
          <div className="status-content">
            <div className="status-label">마지막 동기화</div>
            <div className="status-value">
              {simulationStats.lastUpdate || '없음'}
            </div>
          </div>
        </div>

        {/* 시스템 시간 */}
        <div className="status-item">
          <div className="status-icon">🕐</div>
          <div className="status-content">
            <div className="status-label">시스템 시간</div>
            <div className="status-value">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* 상세 통계 */}
      {isRunning && (
        <div className="detailed-stats">
          <div className="stats-row">
            <span className="stat-label">총 업데이트:</span>
            <span className="stat-value">{simulationStats.totalUpdates}회</span>
          </div>
          <div className="stats-row">
            <span className="stat-label">오류 횟수:</span>
            <span className={`stat-value ${simulationStats.errors > 0 ? 'error' : ''}`}>
              {simulationStats.errors}회
            </span>
          </div>
        </div>
      )}

      {/* 성능 지표 */}
      <div className="performance-indicator">
        <div className="perf-label">애플리케이션 성능:</div>
        <div className="perf-bars">
          {/* Firebase 응답 속도 */}
          <div className="perf-bar">
            <span className="perf-name">Firebase</span>
            <div className="perf-progress">
              <div
                className="perf-fill firebase"
                style={{
                  width: `${Math.max(10, Math.min(100, 100 - (performanceStats.firebaseResponseTime - 50) / 2))}%`
                }}
              ></div>
            </div>
            <span className="perf-value">{performanceStats.firebaseResponseTime}ms</span>
          </div>

          {/* 데이터 업데이트 성공률 */}
          <div className="perf-bar">
            <span className="perf-name">성공률</span>
            <div className="perf-progress">
              <div
                className="perf-fill success-rate"
                style={{ width: `${performanceStats.dataUpdateSuccessRate}%` }}
              ></div>
            </div>
            <span className="perf-value">{performanceStats.dataUpdateSuccessRate}%</span>
          </div>

          {/* 평균 처리시간 */}
          {isRunning && performanceStats.averageProcessingTime > 0 && (
            <div className="perf-bar">
              <span className="perf-name">처리시간</span>
              <div className="perf-progress">
                <div
                  className="perf-fill processing-time"
                  style={{
                    width: `${Math.min(100, Math.max(10, 100 - (performanceStats.averageProcessingTime / 10)))}%`
                  }}
                ></div>
              </div>
              <span className="perf-value">{performanceStats.averageProcessingTime}ms</span>
            </div>
          )}

          {/* 오류율 */}
          {simulationStats.totalUpdates > 0 && (
            <div className="perf-bar">
              <span className="perf-name">오류율</span>
              <div className="perf-progress">
                <div
                  className="perf-fill error-rate"
                  style={{ width: `${Math.min(100, performanceStats.errorRate * 10)}%` }}
                ></div>
              </div>
              <span className="perf-value">{performanceStats.errorRate}%</span>
            </div>
          )}
        </div>

        {/* 성능 요약 */}
        <div className="perf-summary">
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">처리 속도:</span>
              <span className="summary-value">
                {isRunning ? `${simulationConfig.interval / 1000}초/사이클` : '중지됨'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">총 처리량:</span>
              <span className="summary-value">
                {simulationStats.totalUpdates.toLocaleString()}회
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemStatusPanel