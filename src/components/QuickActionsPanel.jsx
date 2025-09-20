import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulation } from '../contexts/SimulationContext'

function QuickActionsPanel({ onRefresh }) {
  const navigate = useNavigate()
  const {
    isRunning,
    startSimulation,
    stopSimulation,
    simulationConfig,
    updateConfig,
    availableModes
  } = useSimulation()

  const handleSimulationToggle = async () => {
    if (isRunning) {
      stopSimulation()
    } else {
      const success = await startSimulation()
      if (!success) {
        // 시뮬레이션 시작 실패 시 관리자 페이지로 안내
        if (confirm('시뮬레이션할 현장이 없습니다. 관리자 페이지에서 현장을 추가하시겠습니까?')) {
          navigate('/admin')
        }
      }
    }
  }

  const handleRefresh = () => {
    if (onRefresh) onRefresh()

    // 새로고침 애니메이션
    const button = document.querySelector('.action-refresh')
    if (button) {
      button.style.transform = 'rotate(360deg)'
      setTimeout(() => {
        button.style.transform = 'rotate(0deg)'
      }, 600)
    }
  }

  const handleModeChange = (e) => {
    const mode = e.target.value
    updateConfig({ mode })
  }

  const actions = [
    {
      id: 'simulation',
      icon: isRunning ? '⏹️' : '▶️',
      label: isRunning ? '시뮬레이션 중지' : '시뮬레이션 시작',
      description: isRunning
        ? `${simulationConfig.sites.length}개 현장 실행 중`
        : '센서 데이터 자동 생성',
      onClick: handleSimulationToggle,
      variant: isRunning ? 'danger' : 'primary',
      disabled: false
    },
    {
      id: 'admin',
      icon: '⚙️',
      label: '관리자 모드',
      description: '현장 추가/편집/삭제',
      onClick: () => navigate('/admin'),
      variant: 'secondary',
      disabled: false
    },
    {
      id: 'report',
      icon: '📊',
      label: '전체 보고서',
      description: '시스템 상태 요약',
      onClick: () => {
        // 보고서 기능 구현 예정
        alert('보고서 기능은 준비 중입니다.')
      },
      variant: 'info',
      disabled: true
    },
    {
      id: 'refresh',
      icon: '🔄',
      label: '데이터 새로고침',
      description: '실시간 데이터 갱신',
      onClick: handleRefresh,
      variant: 'success',
      disabled: false
    }
  ]

  return (
    <div className="quick-actions-panel">
      <div className="actions-header">
        <h3>🚀 빠른 작업</h3>
        <p>자주 사용하는 기능들에 빠르게 접근할 수 있습니다.</p>
        <div className="sim-mode-control" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: '#6b7280' }}>시뮬레이션 모드</label>
          <select value={simulationConfig.mode} onChange={handleModeChange} style={{ fontSize: 12, padding: '4px 6px' }}>
            {availableModes?.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            className={`action-btn action-${action.id} action-${action.variant} ${action.disabled ? 'disabled' : ''}`}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.description}
          >
            <div className="action-icon">
              {action.icon}
            </div>
            <div className="action-content">
              <div className="action-label">
                {action.label}
              </div>
              <div className="action-description">
                {action.description}
              </div>
            </div>
            {!action.disabled && (
              <div className="action-arrow">
                →
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="actions-footer">
        <small>
          💡 팁: 시뮬레이션을 시작하면 현장들의 센서 데이터가 자동으로 생성됩니다.
        </small>
      </div>
    </div>
  )
}

export default QuickActionsPanel
