import { useState, useEffect } from 'react'
import { ref, onValue, off, query, orderByKey, limitToLast } from 'firebase/database'
import { database } from '../services/firebase'
import { debug, error as logError } from '../utils/log'
import { useThrottledState } from './useThrottledState'

/**
 * 실시간 센서 데이터를 관리하는 커스텀 훅
 * @param {string} [siteId] - 특정 현장 ID (없으면 전체 데이터)
 * @returns {Object} { data, loading, error, connectionStatus }
 */
export const useSensorData = (siteId = null) => {
  const [data, setDataThrottled, setDataImmediate] = useThrottledState(null, 120)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  useEffect(() => {
    debug(
      '🔥 useSensorData 훅 시작:',
      siteId ? `현장 ${siteId}` : '전체 데이터'
    )

    // Firebase 참조 생성
    const dataPath = siteId ? `sensors/${siteId}` : 'sensors'
    const dataRef = ref(database, dataPath)

    debug('📍 Firebase 참조 경로:', dataPath)

    // 실시간 리스너 설정
    const unsubscribe = onValue(
      dataRef,
      snapshot => {
        try {
          debug('📥 Firebase 데이터 수신')
          setConnectionStatus('connected')

          const firebaseData = snapshot.val()
          debug('📊 수신된 데이터 수신됨')

          if (firebaseData) {
            setDataThrottled(firebaseData)
            setError(null)
          } else {
            debug('⚠️ 데이터가 없음')
            setDataImmediate(null)
            setError('데이터가 없습니다.')
          }
        } catch (err) {
          logError('❌ 데이터 처리 오류:', err)
          setError(`데이터 처리 오류: ${err.message}`)
          setConnectionStatus('error')
        } finally {
          setLoading(false)
        }
      },
      err => {
        logError('❌ Firebase 연결 오류:', err)
        setError(`Firebase 연결 오류: ${err.message}`)
        setConnectionStatus('error')
        setLoading(false)
      }
    )

    // 정리 함수
    return () => {
      debug('🔥 useSensorData 훅 정리')
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

  // 다중 센서 지원: 전체 사이트 데이터 반환 (레거시 ultrasonic 체크 제거)
  const sensorData = data || null

  return {
    sensorData,
    loading,
    error,
    connectionStatus,
  }
}

/**
 * 특정 현장의 센서 히스토리 데이터를 가져오는 훅
 * @param {string} siteId - 현장 ID
 * @param {number} limit - 가져올 데이터 개수 (기본값: 20)
 * @returns {Object} { historyData, loading, error, connectionStatus }
 */
export const useSensorHistory = (siteId, limit = 20) => {
  const [historyData, setHistoryDataThrottled, setHistoryDataImmediate] = useThrottledState([], 150)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  useEffect(() => {
    if (!siteId) {
      setError('Site ID가 필요합니다.')
      setLoading(false)
      return
    }

    console.log(
      `🔥 useSensorHistory 훅 시작: 현장 ${siteId}, 제한 ${limit}개`
    )

    // Firebase 히스토리 참조 생성
    const historyPath = `sensors/${siteId}/history`
    const historyRef = ref(database, historyPath)

    console.log('📍 Firebase 히스토리 참조 경로:', historyPath)

    // limitToLast로 최근 데이터만 가져오기
    const limitedQuery = query(
      historyRef,
      orderByKey(),
      limitToLast(limit)
    )

    // 실시간 리스너 설정
    const unsubscribe = onValue(
      limitedQuery,
      snapshot => {
        try {
          console.log('📥 Firebase 히스토리 데이터 수신')
          setConnectionStatus('connected')

          const firebaseData = snapshot.val()
          console.log('📊 수신된 히스토리 데이터:', firebaseData)

          if (firebaseData) {
            // 객체를 배열로 변환하고 timestamp로 정렬
            const historyArray = Object.entries(firebaseData)
              .map(([timestamp, data]) => ({
                timestamp: parseInt(timestamp),
                ...data,
              }))
              .sort((a, b) => b.timestamp - a.timestamp) // 최신순 정렬

            setHistoryDataThrottled(historyArray)
            setError(null)
          } else {
            console.log('⚠️ 히스토리 데이터가 없음')
            setHistoryDataImmediate([])
            setError(null)
          }
        } catch (err) {
          console.error('❌ 히스토리 데이터 처리 오류:', err)
          setError(`히스토리 데이터 처리 오류: ${err.message}`)
          setConnectionStatus('error')
        } finally {
          setLoading(false)
        }
      },
      err => {
        console.error('❌ Firebase 히스토리 연결 오류:', err)
        setError(`Firebase 히스토리 연결 오류: ${err.message}`)
        setConnectionStatus('error')
        setLoading(false)
      }
    )

    // 정리 함수
    return () => {
      console.log('🔥 useSensorHistory 훅 정리')
      unsubscribe()
    }
  }, [siteId, limit])

  return {
    historyData,
    loading,
    error,
    connectionStatus,
  }
}
