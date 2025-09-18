import React from 'react'
import SensorSimulationPanel from '../components/SensorSimulationPanel'

function SimulationPanel() {
  return (
    <div className="simulation-page">
      <div className="page-header">
        <h1>🎮 센서 데이터 시뮬레이션</h1>
        <p>실제 센서 없이도 시스템을 완전히 테스트할 수 있는 시뮬레이션 도구입니다.</p>
      </div>

      <div className="simulation-info">
        <div className="info-card">
          <h3>🚀 시뮬레이션 기능</h3>
          <ul>
            <li><strong>자동 데이터 생성</strong>: 설정된 주기로 모든 현장의 센서 데이터 자동 업데이트</li>
            <li><strong>다양한 모드</strong>: 랜덤, 시나리오, 점진적 변화 모드 지원</li>
            <li><strong>실시간 반영</strong>: 생성된 데이터가 즉시 대시보드와 차트에 반영</li>
            <li><strong>수동 제어</strong>: 특정 상태로 즉시 변경 가능</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>📋 사용 방법</h3>
          <ol>
            <li><strong>현장 생성</strong>: 먼저 관리자 페이지에서 현장을 생성해주세요</li>
            <li><strong>시뮬레이션 시작</strong>: 아래 패널에서 "시작" 버튼 클릭</li>
            <li><strong>실시간 확인</strong>: 대시보드나 개별 현장에서 데이터 변화 확인</li>
            <li><strong>상태 테스트</strong>: 수동 제어로 다양한 상태 시나리오 테스트</li>
          </ol>
        </div>
      </div>

      {/* 시뮬레이션 패널 */}
      <SensorSimulationPanel />

      <div className="simulation-tips">
        <h3>💡 팁</h3>
        <div className="tips-grid">
          <div className="tip-item">
            <h4>🎯 상태 테스트</h4>
            <p>수동 제어로 모든 센서를 경고 상태로 바꾸고 대시보드에서 색상 변화를 확인해보세요.</p>
          </div>
          <div className="tip-item">
            <h4>📈 차트 확인</h4>
            <p>개별 현장 페이지에서 실시간 차트가 어떻게 업데이트되는지 확인해보세요.</p>
          </div>
          <div className="tip-item">
            <h4>🔄 모드 비교</h4>
            <p>랜덤, 시나리오, 점진적 모드를 바꿔가며 데이터 패턴의 차이를 비교해보세요.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimulationPanel