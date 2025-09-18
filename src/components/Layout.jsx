import React from 'react'
import { Link, Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            초음파 모니터링
          </Link>
          <ul className="nav-menu">
            <li>
              <Link to="/">대시보드</Link>
            </li>
            <li>
              <Link to="/site/site1">현장1</Link>
            </li>
            <li>
              <Link to="/site/site2">현장2</Link>
            </li>
            <li>
              <Link to="/test">테스트</Link>
            </li>
          </ul>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
