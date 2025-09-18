import React, { useState, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ref, onValue, query, orderByKey, limitToLast } from 'firebase/database'
import { database } from '../services/firebase'
import {
  transformHistoryForChart,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../types/sensor'

function SensorChart({ siteId, sensorKey = 'ultrasonic_01', sensorData, limit = 20, height = 300, connectionStatus = 'connected', sensorName = '' }) {
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!siteId || !sensorKey) return

    setLoading(true)
    setError(null)

    // Firebase 히스토리 경로 생성
    const historyPath = `sensors/${siteId}/${sensorKey}/history`
    const historyRef = ref(database, historyPath)
    const historyQuery = query(historyRef, orderByKey(), limitToLast(limit))

    console.log(`📊 SensorChart: ${siteId}/${sensorKey} 히스토리 감지 시작`)

    const unsubscribe = onValue(
      historyQuery,
      (snapshot) => {
        try {
          const firebaseData = snapshot.val()
          console.log(`📊 ${sensorKey} 히스토리 수신:`, firebaseData)
          console.log(`📊 히스토리 경로: ${historyPath}`)
          console.log(`📊 스냅샷 존재 여부:`, snapshot.exists())

          if (firebaseData) {
            const historyArray = Object.entries(firebaseData)
              .map(([timestamp, data]) => ({
                timestamp: parseInt(timestamp),
                ...data,
              }))
              .sort((a, b) => a.timestamp - b.timestamp) // 차트는 시간순 정렬

            setHistoryData(historyArray)
            setError(null)
          } else {
            setHistoryData([])
            setError(null)
          }
        } catch (err) {
          console.error(`❌ ${sensorKey} 히스토리 처리 오류:`, err)
          setError(`히스토리 데이터 처리 오류: ${err.message}`)
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.error(`❌ ${sensorKey} Firebase 연결 오류:`, err)
        setError(`Firebase 연결 오류: ${err.message}`)
        setLoading(false)
      }
    )

    return () => {
      console.log(`🔥 SensorChart: ${sensorKey} 히스토리 감지 중지`)
      unsubscribe()
    }
  }, [siteId, sensorKey, limit])

  // 차트 데이터 변환 (useMemo로 성능 최적화)
  const chartData = useMemo(() => {
    if (!historyData || historyData.length === 0) return []
    return transformHistoryForChart(historyData)
  }, [historyData])

  // 상태별 색상 가져오기
  const getLineColor = status => STATUS_COLORS[status] || STATUS_COLORS.offline

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{`시간: ${label}`}</p>
          <p className="tooltip-distance">
            {`거리: ${data.distance} cm`}
          </p>
          <p
            className="tooltip-status"
            style={{ color: getLineColor(data.status) }}
          >
            {`상태: ${STATUS_LABELS[data.status] || data.status}`}
          </p>
        </div>
      )
    }
    return null
  }

  // 점 색상 커스터마이징
  const CustomDot = props => {
    const { cx, cy, payload } = props
    if (!payload) return null

    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill={getLineColor(payload.status)}
        stroke={getLineColor(payload.status)}
        strokeWidth={2}
      />
    )
  }

  if (loading) {
    return (
      <div className="sensor-chart">
        <h3>실시간 차트</h3>
        <div className="chart-loading">
          <div className="spinner"></div>
          <p>차트 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sensor-chart">
        <h3>실시간 차트</h3>
        <div className="chart-error">
          <p>❌ {error}</p>
          <p className="error-detail">
            연결 상태: {connectionStatus === 'error' ? '연결 실패' : connectionStatus}
          </p>
        </div>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="sensor-chart">
        <h3>실시간 차트</h3>
        <div className="chart-no-data">
          <p>차트에 표시할 데이터가 없습니다.</p>
          <p className="data-info">
            최소 2개 이상의 히스토리 데이터가 필요합니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="sensor-chart">
      <div className="chart-header">
        <h3>{sensorName ? `${sensorName} 실시간 차트` : '실시간 차트'}</h3>
        <div className="chart-info">
          <span className="chart-data-count">
            {chartData.length}개 데이터
          </span>
          <span className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '🟢 실시간' : '🔴 연결 안됨'}
          </span>
        </div>
      </div>

      <div className="chart-container" style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              label={{ value: '거리 (cm)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="distance"
              stroke="#3498db"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 5, stroke: '#3498db', strokeWidth: 2 }}
              connectNulls={false}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <div className="legend-items">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: color }}
              ></div>
              <span className="legend-label">
                {STATUS_LABELS[status] || status}
              </span>
            </div>
          ))}
        </div>
        <div className="chart-note">
          <small>
            💡 점 색상은 해당 시점의 측정 상태를 나타냅니다
          </small>
        </div>
      </div>
    </div>
  )
}

export default SensorChart