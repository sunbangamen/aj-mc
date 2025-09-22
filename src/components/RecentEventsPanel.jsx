import React, { useState, useEffect, useMemo } from 'react'
import { generateRecentEvents, formatTimeAgo, EVENT_PRIORITY } from '../utils/eventTracker'

function RecentEventsPanel({ allSites }) {
  const [events, setEvents] = useState([])
  const [previousSites, setPreviousSites] = useState([])
  const [collapsed, setCollapsed] = useState(true) // 기본 접힘

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

  // 중요 이벤트만 표시 (HIGH 우선순위: 예, 경고/오프라인)
  const importantEvents = useMemo(
    () => events.filter(e => e.priority === EVENT_PRIORITY.HIGH),
    [events]
  )

  // 중요 이벤트가 없다면 패널 숨김
  if (importantEvents.length === 0) return null

  return (
    <div className="recent-events-panel">
      <div className="events-header">
        <h3>🚨 중요 이벤트</h3>
        <div className="events-actions">
          <span className="events-count">{importantEvents.length}개</span>
          <button className="btn btn-sm" onClick={() => setCollapsed(v => !v)}>
            {collapsed ? '펼치기' : '접기'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="events-list">
            {importantEvents.map((event) => (
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
            <button className="btn-link" onClick={() => setCollapsed(true)}>
              접기 ↑
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default RecentEventsPanel
