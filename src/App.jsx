import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import SiteMonitor from './pages/SiteMonitor'
import TestPanel from './pages/TestPanel'
import AdminDashboard from './pages/AdminDashboard'
import AdminPanel from './pages/AdminPanel'
import SimulationPanel from './pages/SimulationPanel'
import { SimulationProvider } from './contexts/SimulationContext'
import { testFirebaseConnection } from './services/firebase'
import AutoCleanupManager from './components/AutoCleanupManager'
import './App.css'

function App() {
  // Firebase 연결 테스트
  React.useEffect(() => {
    testFirebaseConnection()
  }, [])

  return (
    <SimulationProvider>
      <ErrorBoundary>
        <BrowserRouter>
          {/* 알림 히스토리/캐시 자동 정리 스케줄러 */}
          <AutoCleanupManager />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="site/:siteId" element={<SiteMonitor />} />
              <Route path="test" element={<TestPanel />} />
              <Route path="admin" element={<AdminPanel />} />
              <Route path="admin-dashboard" element={<AdminDashboard />} />
              <Route path="simulation" element={<SimulationPanel />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </SimulationProvider>
  )
}

export default App
