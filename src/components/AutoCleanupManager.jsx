import { useEffect } from 'react'
import { startAutoCleanup, stopAutoCleanup } from '../utils/alertSystem'
import { database } from '../services/firebase'

// 앱 전역에서 알림 히스토리/캐시 자동 정리를 활성화하는 관리자
// - CLEANUP_CONFIG는 utils/alertSystem.js에서 조정 가능
export default function AutoCleanupManager() {
  useEffect(() => {
    startAutoCleanup(database)
    return () => {
      stopAutoCleanup()
    }
  }, [])

  return null
}

