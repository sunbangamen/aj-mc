import React, { useState, useEffect } from 'react'
import { ref, onValue, query, orderByKey, limitToLast } from 'firebase/database'
import { database } from '../services/firebase'
import {
  formatDateTime,
  STATUS_LABELS,
  getStatusStyle,
  isValidSensorData,
  getSensorValue,
  getSensorUnit,
} from '../types/sensor'
import { debug, error as logError } from '../utils/log'
import { useThrottledState } from '../hooks/useThrottledState'

const MeasurementTable = React.memo(function MeasurementTable({ siteId, sensorKey = 'ultrasonic_1', sensorData, limit = 20, connectionStatus = 'connected', sensorName = '' }) {
  const [historyData, setHistoryDataThrottled, setHistoryDataImmediate] = useThrottledState([], 150)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visibleCount, setVisibleCount] = useState(5)

  useEffect(() => {
    if (!siteId || !sensorKey) return

    setLoading(true)
    setError(null)

    // Firebase 히스토리 경로 생성
    const historyPath = `sensors/${siteId}/${sensorKey}/history`
    const historyRef = ref(database, historyPath)
    const historyQuery = query(historyRef, orderByKey(), limitToLast(limit))

    debug(`📋 MeasurementTable: ${siteId}/${sensorKey} 히스토리 감지 시작`)

    const unsubscribe = onValue(
      historyQuery,
      (snapshot) => {
        try {
          const firebaseData = snapshot.val()
          debug(`📋 ${sensorKey} 측정 이력 수신 (exists=${snapshot.exists()})`)

          if (firebaseData) {
            const historyArray = Object.entries(firebaseData)
              .map(([timestamp, data]) => ({
                timestamp: parseInt(timestamp),
                ...data,
              }))
              .sort((a, b) => b.timestamp - a.timestamp) // 테이블은 최신순 정렬

            setHistoryDataThrottled(historyArray)
            setError(null)
          } else {
            setHistoryDataImmediate([])
            setError(null)
          }
        } catch (err) {
          logError(`❌ ${sensorKey} 측정 이력 처리 오류:`, err)
          setError(`측정 이력 처리 오류: ${err.message}`)
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        logError(`❌ ${sensorKey} Firebase 연결 오류:`, err)
        setError(`Firebase 연결 오류: ${err.message}`)
        setLoading(false)
      }
    )

    return () => {
      debug(`🔥 MeasurementTable: ${sensorKey} 히스토리 감지 중지`)
      unsubscribe()
    }
  }, [siteId, sensorKey, limit])

  // 유효한 데이터 산출은 항상 훅들 위에서 실행되도록 유지
  const validHistoryData = historyData.filter(isValidSensorData)
  // 표시 개수 관리 (5개씩 더보기) - 훅은 반환문 이전에 항상 호출
  useEffect(() => {
    const base = Math.min(5, validHistoryData.length)
    setVisibleCount(prev => {
      if (prev > validHistoryData.length) return base
      if (prev < 5) return base
      return prev
    })
  }, [validHistoryData.length])

  if (loading) {
    return (
      <div className="measurement-table">
        <h3>측정 이력</h3>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>측정 이력을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="measurement-table">
        <h3>측정 이력</h3>
        <div className="error-message">
          <p>❌ {error}</p>
          <p className="error-detail">
            연결 상태: {connectionStatus === 'error' ? '연결 실패' : connectionStatus}
          </p>
        </div>
      </div>
    )
  }

  if (!historyData || historyData.length === 0) {
    return (
      <div className="measurement-table">
        <h3>측정 이력</h3>
        <div className="no-data">
          <p>측정 이력이 없습니다.</p>
          <p className="data-info">
            Firebase에서 {siteId}/{sensorKey}/history 경로의 데이터를 확인해주세요.
          </p>
        </div>
      </div>
    )
  }
  
  // 표시할 데이터 산출
  const displayed = validHistoryData.slice(0, visibleCount)

  return (
    <div className="measurement-table compact">
      <div className="table-header">
        <h3>{sensorName ? `${sensorName} 측정 이력` : '측정 이력'}</h3>
        <div className="table-info">
          <span className="data-count">{displayed.length}개 / 총 {validHistoryData.length}개</span>
          <span className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '🟢 실시간' : '🔴 연결 안됨'}
          </span>
          {visibleCount < validHistoryData.length && (
            <button className="btn btn-sm" onClick={() => setVisibleCount(v => Math.min(v + 5, validHistoryData.length))} style={{ marginLeft: 8 }}>
              더보기 +5
            </button>
          )}
          {visibleCount > 5 && (
            <button className="btn btn-sm" onClick={() => setVisibleCount(Math.min(5, validHistoryData.length))} style={{ marginLeft: 4 }}>
              접기
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="measurement-table-grid density-compact">
          <thead>
            <tr>
              <th>시간</th>
              <th>측정값</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((data, index) => {
              // 센서 타입에 따른 값과 단위 결정
              const sensorType = sensorKey ? sensorKey.split('_')[0] : 'ultrasonic'
              const value = getSensorValue(data, sensorType)
              const unit = getSensorUnit(sensorType)
              const statusStyle = getStatusStyle(data.status)
              return (
                <tr
                  key={`${data.timestamp}-${index}`}
                  className="measurement-row"
                  style={{ borderLeft: statusStyle.borderLeft }}
                >
                  <td className="time-cell">
                    {formatDateTime(data.timestamp)}
                  </td>
                  <td className="distance-cell">
                    <span className="distance-value">
                      {value || '---'} {unit}
                    </span>
                  </td>
                  <td className="status-cell">
                    <span
                      className="status-badge"
                      style={{
                        color: statusStyle.color,
                        backgroundColor: statusStyle.backgroundColor,
                      }}
                    >
                      {STATUS_LABELS[data.status] || data.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {validHistoryData.length !== historyData.length && (
        <div className="data-warning">
          <p>
            ⚠️ 일부 데이터가 유효하지 않아 제외되었습니다.
            ({historyData.length - validHistoryData.length}개)
          </p>
        </div>
      )}
    </div>
  )
})

export default MeasurementTable
