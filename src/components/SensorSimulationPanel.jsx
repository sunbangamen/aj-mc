import React, { useEffect } from 'react'
import { useSimulation } from '../contexts/SimulationContext'
import { debug } from '../utils/log'

function SensorSimulationPanel() {
  const {
    isRunning,
    simulationConfig,
    simulationStats,
    startSimulation,
    stopSimulation,
    updateConfig,
    forceSensorStatus,
    setAllSensorsStatus,
    availableModes,
    availableStatuses
  } = useSimulation()

  const handleIntervalChange = (newInterval) => {
    updateConfig({ interval: newInterval * 1000 }) // 초를 밀리초로 변환
  }

  const handleModeChange = (newMode) => {
    updateConfig({ mode: newMode })
  }

  // 사이트 목록 변경 감지
  useEffect(() => {
    debug('🎮 시뮬레이션 패널: 사이트 목록 변경됨', {
      count: simulationConfig.sites.length,
      sites: simulationConfig.sites.map(s => s.name || s.id)
    })
  }, [simulationConfig.sites])

  return (
    <div className="simulation-panel">
      <div className="simulation-header">
        <h3>🎮 센서 데이터 시뮬레이션</h3>
        <div className="simulation-status">
          <span className={`status-indicator ${isRunning ? 'running' : 'stopped'}`}>
            {isRunning ? '🟢 실행 중' : '⚫ 중지됨'}
          </span>
        </div>
      </div>

      {/* 시뮬레이션 컨트롤 */}
      <div className="simulation-controls">
        <div className="control-group">
          <h4>기본 제어</h4>
          <div className="button-group">
            <button
              className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'}`}
              onClick={isRunning ? stopSimulation : startSimulation}
            >
              {isRunning ? '⏹️ 중지' : '▶️ 시작'}
            </button>
          </div>
        </div>

        <div className="control-group">
          <h4>시뮬레이션 설정</h4>

          <div className="form-row">
            <label>업데이트 주기 (초)</label>
            <select
              value={simulationConfig.interval / 1000}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              disabled={isRunning}
            >
              <option value={1}>1초</option>
              <option value={3}>3초</option>
              <option value={5}>5초</option>
              <option value={10}>10초</option>
              <option value={30}>30초</option>
            </select>
          </div>

          <div className="form-row">
            <label>시뮬레이션 모드</label>
            <select
              value={simulationConfig.mode}
              onChange={(e) => handleModeChange(e.target.value)}
              disabled={isRunning}
            >
              {availableModes.map(mode => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 수동 제어 */}
        <div className="control-group">
          <h4>수동 제어</h4>
          <div className="manual-controls">
            <label>모든 센서 상태 변경:</label>
            <div className="status-buttons">
              {availableStatuses.map(status => (
                <button
                  key={status}
                  className={`btn btn-sm btn-status-${status}`}
                  onClick={() => setAllSensorsStatus(status)}
                  title={`모든 센서를 ${status} 상태로 설정`}
                >
                  {status === 'normal' && '🟢 정상'}
                  {status === 'warning' && '🟡 주의'}
                  {status === 'alert' && '🔴 경고'}
                  {status === 'offline' && '⚫ 오프라인'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 시뮬레이션 통계 */}
      <div className="simulation-stats">
        <h4>시뮬레이션 통계</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">총 업데이트:</span>
            <span className="stat-value">{simulationStats.totalUpdates}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">마지막 업데이트:</span>
            <span className="stat-value">
              {simulationStats.lastUpdate || '없음'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">오류 횟수:</span>
            <span className="stat-value error">
              {simulationStats.errors}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">대상 사이트:</span>
            <span className="stat-value">
              {simulationConfig.sites.length}개
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">사이트 목록:</span>
            <span className="stat-value" style={{ fontSize: '0.8rem' }}>
              {simulationConfig.sites.map(site => site.name || site.id).join(', ') || '없음'}
            </span>
          </div>
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="simulation-help">
        <h4>💡 사용법</h4>
        <ul>
          <li><strong>시작:</strong> 등록된 모든 사이트의 센서 데이터를 자동 생성</li>
          <li><strong>랜덤 모드:</strong> 확률적으로 다양한 상태 생성</li>
          <li><strong>시나리오 모드:</strong> 정상→주의→경고→정상 패턴 반복</li>
          <li><strong>점진적 모드:</strong> 이전 값에서 서서히 변화</li>
          <li><strong>수동 제어:</strong> 특정 상태로 즉시 변경 가능</li>
        </ul>
      </div>
    </div>
  )
}

export default SensorSimulationPanel
