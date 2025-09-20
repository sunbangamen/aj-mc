import { initializeApp } from 'firebase/app'
import { getDatabase, ref, update } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Firebase 초기화
const app = initializeApp(firebaseConfig)

// Realtime Database 인스턴스
export const database = getDatabase(app)

// 연결 상태 확인 함수
export const testFirebaseConnection = () => {
  try {
    console.log('Firebase 연결 테스트...')
    console.log('Database URL:', firebaseConfig.databaseURL)
    console.log('Project ID:', firebaseConfig.projectId)
    return true
  } catch (error) {
    console.error('Firebase 연결 실패:', error)
    return false
  }
}

// 센서 데이터 업데이트 함수 (위치 정보 편집용)
export const updateSensorData = async (siteId, sensorKey, updateData) => {
  try {
    const sensorRef = ref(database, `sensors/${siteId}/${sensorKey}`)
    await update(sensorRef, updateData)
    console.log(`✅ 센서 데이터 업데이트 완료: ${siteId}/${sensorKey}`, updateData)
  } catch (error) {
    console.error(`❌ 센서 데이터 업데이트 실패: ${siteId}/${sensorKey}`, error)
    throw error
  }
}

export default app
