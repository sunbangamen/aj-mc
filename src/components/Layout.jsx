import React, { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useSites } from '../hooks/useSiteManagement'
import { useSimulation } from '../contexts/SimulationContext'

function Layout() {
  const { sites, loading } = useSites()
  const { isRunning, watchdog } = useSimulation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const handleSiteSelect = (siteId) => {
    navigate(`/site/${siteId}`)
    setIsDropdownOpen(false)
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            (사)안전재해환경대책본부
          </Link>
          <ul className="nav-menu">
            <li>
              <Link to="/">대시보드</Link>
            </li>

            {/* 현장 드롭다운 */}
            <li className="nav-dropdown">
              <button
                className="dropdown-toggle"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
              >
                🏢 현장 ({sites.length})
                <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
              </button>

              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {loading ? (
                    <div className="dropdown-item loading">
                      로딩 중...
                    </div>
                  ) : sites.length === 0 ? (
                    <div className="dropdown-item empty">
                      등록된 현장이 없습니다
                    </div>
                  ) : (
                    sites.map((site) => (
                      <button
                        key={site.id}
                        className="dropdown-item"
                        onClick={() => handleSiteSelect(site.id)}
                      >
                        <span className="site-name">{site.name || site.id}</span>
                        <span className="site-id">{site.id}</span>
                      </button>
                    ))
                  )}

                  {sites.length > 0 && (
                    <div className="dropdown-divider"></div>
                  )}

                  <button
                    className="dropdown-item add-site"
                    onClick={() => {
                      navigate('/admin')
                      setIsDropdownOpen(false)
                    }}
                  >
                    ➕ 새 현장 추가
                  </button>
                </div>
              )}
            </li>

            {/* 고정 링크들 */}
            <li>
              <Link to="/test">🔧 테스트</Link>
            </li>
            <li>
              <Link to="/simulation">
                🎮 시뮬레이션 {isRunning && <span className="sim-status">●</span>}
              </Link>
            </li>
            <li>
              <Link to="/admin">🔧 시스템 관리</Link>
            </li>
            <li>
              <Link to="/admin-dashboard">⚙️ 사이트 관리</Link>
            </li>
          </ul>
        </div>
      </nav>
      {/* 시뮬레이션 워치독 경고 배너 */}
      {isRunning && watchdog?.status === 'delayed' && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #FCA5A5',
            padding: '8px 12px',
            fontWeight: 600
          }}
        >
          ⚠️ 시뮬레이션 지연이 감지되었습니다. 연결/속도를 확인하세요.
        </div>
      )}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
