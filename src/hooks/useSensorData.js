import { useState, useEffect } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { database } from '../services/firebase'

/**
 * 실시간 센서 데이터를 관리하는 커스텀 훅
 * @param {string} [siteId] - 특정 현장 ID (없으면 전체 데이터)
 * @returns {Object} { data, loading, error, connectionStatus }
 */
export const useSensorData = (siteId = null) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  useEffect(() => {
    console.log(
      '🔥 useSensorData 훅 시작:',
      siteId ? `현장 ${siteId}` : '전체 데이터'
    )

    // Firebase 참조 생성
    const dataPath = siteId ? `sensors/${siteId}` : 'sensors'
    const dataRef = ref(database, dataPath)

    console.log('📍 Firebase 참조 경로:', dataPath)

    // 실시간 리스너 설정
    const unsubscribe = onValue(
      dataRef,
      snapshot => {
        try {
          console.log('📥 Firebase 데이터 수신')
          setConnectionStatus('connected')

          const firebaseData = snapshot.val()
          console.log('📊 수신된 데이터:', firebaseData)

          if (firebaseData) {
            setData(firebaseData)
            setError(null)
          } else {
            console.log('⚠️ 데이터가 없음')
            setData(null)
            setError('데이터가 없습니다.')
          }
        } catch (err) {
          console.error('❌ 데이터 처리 오류:', err)
          setError(`데이터 처리 오류: ${err.message}`)
          setConnectionStatus('error')
        } finally {
          setLoading(false)
        }
      },
      err => {
        console.error('❌ Firebase 연결 오류:', err)
        setError(`Firebase 연결 오류: ${err.message}`)
        setConnectionStatus('error')
        setLoading(false)
      }
    )

    // 정리 함수
    return () => {
      console.log('🔥 useSensorData 훅 정리')
      off(dataRef)
      unsubscribe()
    }
  }, [siteId])

  return {
    data,
    loading,
    error,
    connectionStatus,
  }
}

/**
 * 전체 현장 데이터를 가져오는 훅
 * @returns {Object} { allSites, loading, error, connectionStatus }
 */
export const useAllSensorData = () => {
  const { data, loading, error, connectionStatus } = useSensorData()

  // 데이터를 배열 형태로 변환
  const allSites = data
    ? Object.entries(data).map(([siteId, siteData]) => ({
        siteId,
        ...siteData,
      }))
    : []

  return {
    allSites,
    loading,
    error,
    connectionStatus,
  }
}

/**
 * 특정 현장의 센서 데이터를 가져오는 훅
 * @param {string} siteId - 현장 ID
 * @returns {Object} { sensorData, loading, error, connectionStatus }
 */
export const useSiteSensorData = siteId => {
  const { data, loading, error, connectionStatus } = useSensorData(siteId)

  return {
    sensorData: data?.ultrasonic || null,
    loading,
    error,
    connectionStatus,
  }
}
