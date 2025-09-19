import React, { useState } from 'react'
import { useSites } from '../hooks/useSiteManagement'
import { useSiteSensorData } from '../hooks/useSensorData'
import { initializeTestEnvironment } from '../utils/createTestSite'

function TestPanel() {
  const { sites, loading: sitesLoading } = useSites()
  const [selectedSiteId, setSelectedSiteId] = useState('test')
  const [isInitializing, setIsInitializing] = useState(false)

  const { sensorData, loading, error, connectionStatus } =
    useSiteSensorData(selectedSiteId)

  const handleInitializeTest = async () => {
    setIsInitializing(true)
    try {
      const result = await initializeTestEnvironment()
      if (result.success) {
        alert(result.message)
        window.location.reload()
      } else {
        alert(`초기화 실패: ${result.error}`)
      }
    } catch (err) {
      alert(`초기화 실패: ${err.message}`)
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="test-panel">
      <h1>🔧 현장별 센서 테스트</h1>
      <p>개별 현장의 Firebase 연결 및 센서 데이터 상태를 확인합니다.</p>

      {/* 현장 선택 */}
      <div className="site-selector">
        <h3>테스트할 현장 선택</h3>
        <select
          value={selectedSiteId}
          onChange={(e) => setSelectedSiteId(e.target.value)}
          className="form-select"
          disabled={sitesLoading}
        >
          <option value="test">테스트 현장 (기본)</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name} ({site.id})
            </option>
          ))}
        </select>
        {sitesLoading && <p>현장 목록 로딩 중...</p>}
      </div>

      {/* 테스트 환경 초기화 */}
      {error && selectedSiteId === 'test' && (
        <div className="test-initialization">
          <h3>🚀 테스트 환경 초기화</h3>
          <p>테스트 사이트가 없어서 연결 오류가 발생했습니다.</p>
          <button
            className="btn btn-primary"
            onClick={handleInitializeTest}
            disabled={isInitializing}
          >
            {isInitializing ? '초기화 중...' : '🔧 테스트 환경 자동 설정'}
          </button>
          <p className="help-text">
            이 버튼을 클릭하면 Firebase에 테스트용 사이트와 센서 데이터가 자동으로 생성됩니다.
          </p>
        </div>
      )}

      {/* 현장별 오류 메시지 */}
      {error && selectedSiteId !== 'test' && (
        <div className="test-initialization">
          <h3>⚠️ 현장 연결 오류</h3>
          <p>선택한 현장 "{selectedSiteId}"에서 센서 데이터를 찾을 수 없습니다.</p>
          <p>관리자 페이지에서 현장을 다시 생성하거나 시뮬레이션을 통해 데이터를 생성해보세요.</p>
        </div>
      )}

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
            <code>/sensors/test/ultrasonic_1/</code>
            <div className="sample-data">
              <h5>샘플 데이터:</h5>
              <pre>
                {JSON.stringify(
                  { distance: 100, timestamp: Date.now(), status: 'normal' },
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
          <li><strong>현장 선택</strong>: 위에서 테스트할 현장을 선택</li>
          <li><strong>연결 상태 확인</strong>: Firebase 연결이 정상인지 확인</li>
          <li><strong>센서 데이터 확인</strong>: 실시간 데이터가 표시되는지 확인</li>
          <li><strong>수동 테스트</strong>: Firebase Console에서 직접 데이터 변경</li>
          <li><strong>시뮬레이션</strong>: 자동 데이터 생성은 '시뮬레이션' 메뉴 사용</li>
        </ol>

        <div className="test-note">
          <p><strong>💡 팁:</strong> 각 현장별로 센서 연결 상태와 데이터 수신 여부를 개별적으로 확인할 수 있습니다.</p>
        </div>
      </div>
    </div>
  )
}

export default TestPanel
