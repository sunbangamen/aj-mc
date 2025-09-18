import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SiteMonitor from './pages/SiteMonitor'
import TestPanel from './pages/TestPanel'
import AdminDashboard from './pages/AdminDashboard'
import SimulationPanel from './pages/SimulationPanel'
import { SimulationProvider } from './contexts/SimulationContext'
import { testFirebaseConnection } from './services/firebase'
import './App.css'

function App() {
  // Firebase 연결 테스트
  React.useEffect(() => {
    testFirebaseConnection()
  }, [])

  return (
    <SimulationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="site/:siteId" element={<SiteMonitor />} />
            <Route path="test" element={<TestPanel />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="simulation" element={<SimulationPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SimulationProvider>
  )
}

export default App
