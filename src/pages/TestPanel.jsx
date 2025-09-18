import React from 'react'
import { useSiteSensorData } from '../hooks/useSensorData'

function TestPanel() {
  const { sensorData, loading, error, connectionStatus } =
    useSiteSensorData('test')

  return (
    <div className="test-panel">
      <h1>테스트 패널</h1>
      <p>Firebase 실시간 데이터 수신 테스트</p>

      <div className="connection-info">
        <h3>연결 상태</h3>
        <div className={`connection-status ${connectionStatus}`}>
          <span className="status-dot"></span>
          {connectionStatus === 'connected'
            ? '🟢 Firebase 연결됨'
            : connectionStatus === 'connecting'
              ? '🟡 연결 중...'
              : '🔴 연결 실패'}
        </div>
      </div>

      <div className="test-data">
        <h3>테스트 데이터</h3>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>데이터를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="error-section">
            <h4>❌ 오류 발생</h4>
            <p>{error}</p>
            <details>
              <summary>문제 해결 방법</summary>
              <ul>
                <li>
                  Firebase Console에서 Realtime Database가 활성화되었는지 확인
                </li>
                <li>보안 규칙이 개발용으로 설정되었는지 확인</li>
                <li>.env 파일의 Firebase 설정값이 올바른지 확인</li>
                <li>네트워크 연결 상태 확인</li>
              </ul>
            </details>
          </div>
        )}

        {sensorData && (
          <div className="data-section">
            <h4>✅ 데이터 수신 성공</h4>
            <div className="data-display">
              <pre>{JSON.stringify(sensorData, null, 2)}</pre>
            </div>
            <div className="data-summary">
              <p>
                <strong>거리:</strong> {sensorData.distance} cm
              </p>
              <p>
                <strong>상태:</strong> {sensorData.status}
              </p>
              <p>
                <strong>시간:</strong>{' '}
                {new Date(sensorData.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {!loading && !error && !sensorData && (
          <div className="no-data-section">
            <h4>⚠️ 데이터 없음</h4>
            <p>Firebase Console에서 다음 경로에 데이터를 추가해주세요:</p>
            <code>/sensors/test/ultrasonic/</code>
            <div className="sample-data">
              <h5>샘플 데이터:</h5>
              <pre>
                {JSON.stringify(
                  {
                    distance: 100,
                    timestamp: Date.now(),
                    status: 'normal',
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="test-instructions">
        <h3>테스트 방법</h3>
        <ol>
          <li>Firebase Console → Realtime Database 접속</li>
          <li>데이터 탭에서 `/sensors/test/ultrasonic/distance` 값 변경</li>
          <li>이 페이지에서 실시간으로 값이 변경되는지 확인</li>
        </ol>
      </div>
    </div>
  )
}

export default TestPanel
