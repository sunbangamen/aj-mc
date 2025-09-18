import React, { useState, useEffect } from 'react'
import { generateRecentEvents, formatTimeAgo, EVENT_PRIORITY } from '../utils/eventTracker'

function RecentEventsPanel({ allSites }) {
  const [events, setEvents] = useState([])
  const [previousSites, setPreviousSites] = useState([])

  // 이벤트 생성 및 업데이트
  useEffect(() => {
    const newEvents = generateRecentEvents(allSites, previousSites)
    setEvents(prev => {
      // 기존 이벤트와 새 이벤트 합치기
      const combined = [...newEvents, ...prev]
      // 중복 제거 및 최신순 정렬
      const unique = combined.filter((event, index, self) =>
        index === self.findIndex(e => e.id === event.id)
      )
      return unique.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
    })

    setPreviousSites(allSites)
  }, [allSites, previousSites])

  // 주기적으로 시간 업데이트 (1분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev => [...prev]) // 리렌더링 강제
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  if (events.length === 0) {
    return (
      <div className="recent-events-panel">
        <div className="events-header">
          <h3>🚨 최근 이벤트</h3>
          <span className="events-count">0개</span>
        </div>
        <div className="no-events">
          <p>최근 이벤트가 없습니다.</p>
          <small>시스템 상태 변경 시 여기에 표시됩니다.</small>
        </div>
      </div>
    )
  }

  return (
    <div className="recent-events-panel">
      <div className="events-header">
        <h3>🚨 최근 이벤트</h3>
        <span className="events-count">{events.length}개</span>
      </div>

      <div className="events-list">
        {events.map((event) => (
          <div
            key={event.id}
            className={`event-item priority-${event.priority}`}
          >
            <div className="event-icon">
              {event.icon}
            </div>
            <div className="event-content">
              <div className="event-main">
                <span className="event-site">{event.siteName}:</span>
                <span className="event-message">{event.message}</span>
              </div>
              <div className="event-time">
                {formatTimeAgo(event.timestamp)}
              </div>
            </div>
            <div className={`event-status status-${event.status}`}>
              <div className="status-dot"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="events-footer">
        <button className="btn-link">
          모든 이벤트 보기 →
        </button>
      </div>
    </div>
  )
}

export default RecentEventsPanel