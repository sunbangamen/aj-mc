import React, { useState } from 'react'
import { useSimulation } from '../contexts/SimulationContext'

/**
 * 센서 위치 정보 편집 컴포넌트
 * 클릭하면 인라인 편집 모드가 활성화됩니다
 */
const SensorLocationEditor = ({
  siteId,
  sensorKey,
  currentLocation,
  onLocationUpdate,
  compact = false
}) => {
  const { updateSensorMetadata } = useSimulation()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(currentLocation || '미설정')
  const [isLoading, setIsLoading] = useState(false)

  // 편집 모드 시작
  const startEditing = () => {
    setIsEditing(true)
    setEditValue(currentLocation || '미설정')
  }

  // 편집 취소
  const cancelEditing = () => {
    setIsEditing(false)
    setEditValue(currentLocation || '미설정')
  }

  // 위치 정보 저장
  const saveLocation = async () => {
    if (!editValue.trim()) {
      alert('위치 정보를 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      // updateSensorMetadata 함수 사용 (하드웨어 관리와 동일한 방식)
      if (updateSensorMetadata) {
        const success = await updateSensorMetadata(siteId, sensorKey, {
          location: editValue.trim()
        })

        if (success) {
          // 부모 컴포넌트에 변경 알림
          if (onLocationUpdate) {
            onLocationUpdate(sensorKey, editValue.trim())
          }

          setIsEditing(false)
          console.log(`✅ 센서 위치 업데이트 완료: ${sensorKey} → ${editValue}`)
        } else {
          throw new Error('업데이트 실패')
        }
      } else {
        throw new Error('updateSensorMetadata 함수를 사용할 수 없습니다.')
      }
    } catch (error) {
      console.error('❌ 센서 위치 업데이트 실패:', error)
      alert('위치 정보 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  // Enter 키로 저장
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveLocation()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  if (isEditing) {
    return (
      <div className={`location-editor ${compact ? 'compact' : ''}`}>
        <div className="location-edit-container">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="센서 위치를 입력하세요"
            className="location-input"
            autoFocus
            disabled={isLoading}
          />
          <div className="location-buttons">
            <button
              onClick={saveLocation}
              disabled={isLoading || !editValue.trim()}
              className="btn-save"
              title="저장 (Enter)"
            >
              {isLoading ? '⏳' : '✅'}
            </button>
            <button
              onClick={cancelEditing}
              disabled={isLoading}
              className="btn-cancel"
              title="취소 (Esc)"
            >
              ❌
            </button>
          </div>
        </div>
        {!compact && (
          <p className="location-hint">
            💡 Enter로 저장, Esc로 취소
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className={`location-display ${compact ? 'compact' : ''}`}
      onClick={startEditing}
      title="클릭하여 위치 정보 편집"
    >
      <span className="location-icon">📍</span>
      <span className="location-text">{currentLocation || '미설정'}</span>
      <span className="edit-hint">✏️</span>
    </div>
  )
}

export default SensorLocationEditor