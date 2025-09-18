import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SiteMonitor from './pages/SiteMonitor'
import TestPanel from './pages/TestPanel'
import { testFirebaseConnection } from './services/firebase'
import './App.css'

function App() {
  // Firebase 연결 테스트
  React.useEffect(() => {
    testFirebaseConnection()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="site/:siteId" element={<SiteMonitor />} />
          <Route path="test" element={<TestPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
