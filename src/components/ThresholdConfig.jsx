import React, { useState, useEffect } from 'react'
import { validateThresholds, DEFAULT_THRESHOLDS } from '../utils/alertSystem'

/**
 * Phase 14E: 임계값 설정 컴포넌트
 * 센서별 경고/위험 임계값 설정 UI
 */
const ThresholdConfig = ({ thresholds, onSave, onCancel, siteId = null, siteName = '전역 기본값' }) => {
  const [localThresholds, setLocalThresholds] = useState(thresholds)
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  // 센서 타입별 한글명과 단위
  const sensorTypes = {
    ultrasonic: { name: '초음파', unit: 'cm', description: '거리 측정' },
    temperature: { name: '온도', unit: '°C', description: '온도 측정' },
    humidity: { name: '습도', unit: '%', description: '습도 측정' },
    pressure: { name: '압력', unit: 'hPa', description: '압력 측정' }
  }

  useEffect(() => {
    setLocalThresholds(thresholds)
  }, [thresholds])

  const handleThresholdChange = (sensorType, level, field, value) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return

    setLocalThresholds(prev => ({
      ...prev,
      [sensorType]: {
        ...prev[sensorType],
        [level]: {
          ...prev[sensorType][level],
          [field]: numValue
        }
      }
    }))

    // 실시간 유효성 검증
    validateSensorType(sensorType)
  }

  const handleTimeoutChange = (sensorType, value) => {
    const numValue = parseInt(value) * 1000 // 초 -> 밀리초 변환
    if (isNaN(numValue)) return

    setLocalThresholds(prev => ({
      ...prev,
      [sensorType]: {
        ...prev[sensorType],
        offline_timeout: numValue
      }
    }))
  }

  const validateSensorType = (sensorType) => {
    const sensorThresholds = localThresholds[sensorType]
    const validationErrors = validateThresholds(sensorThresholds, sensorType)

    setErrors(prev => ({
      ...prev,
      [sensorType]: validationErrors
    }))
  }

  const validateAll = () => {
    const allErrors = {}
    let hasErrors = false

    Object.keys(sensorTypes).forEach(sensorType => {
      const sensorThresholds = localThresholds[sensorType]
      const validationErrors = validateThresholds(sensorThresholds, sensorType)

      if (validationErrors.length > 0) {
        allErrors[sensorType] = validationErrors
        hasErrors = true
      }
    })

    setErrors(allErrors)
    return !hasErrors
  }

  const handleSave = async () => {
    if (!validateAll()) {
      alert('설정에 오류가 있습니다. 확인해주세요.')
      return
    }

    setIsSaving(true)

    try {
      const success = await onSave(localThresholds)
      if (success) {
        alert('임계값 설정이 저장되었습니다.')
      } else {
        alert('저장 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('저장 오류:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('모든 센서의 임계값을 기본값으로 초기화하시겠습니까?')) {
      setLocalThresholds(DEFAULT_THRESHOLDS)
      setErrors({})
    }
  }

  const handleSensorReset = (sensorType) => {
    if (confirm(`${sensorTypes[sensorType].name} 센서의 임계값을 기본값으로 초기화하시겠습니까?`)) {
      setLocalThresholds(prev => ({
        ...prev,
        [sensorType]: { ...DEFAULT_THRESHOLDS[sensorType] }
      }))

      // 해당 센서의 에러도 제거
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[sensorType]
        return newErrors
      })
    }
  }

  return (
    <div className="threshold-config">
      <div className="threshold-header">
        <h3>📊 센서 임계값 설정</h3>
        <div className="config-scope">
          {siteId ? (
            <p>📍 <strong>{siteName} 현장</strong> 전용 센서 임계값을 설정합니다.</p>
          ) : (
            <p>🌍 <strong>모든 현장 공통</strong> 기본 임계값을 설정합니다.</p>
          )}
        </div>
      </div>

      <div className="threshold-content">
        {Object.entries(sensorTypes).map(([sensorType, info]) => {
          const config = localThresholds[sensorType]
          const sensorErrors = errors[sensorType] || []

          return (
            <div key={sensorType} className="threshold-section">
              <div className="section-header">
                <div className="sensor-title-row">
                  <h4>
                    {info.name} 센서 ({info.unit})
                    <span className="sensor-description">{info.description}</span>
                  </h4>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleSensorReset(sensorType)}
                    disabled={isSaving}
                    title={`${info.name} 센서 임계값을 기본값으로 초기화`}
                  >
                    🔄 초기화
                  </button>
                </div>
                {sensorErrors.length > 0 && (
                  <div className="error-list">
                    {sensorErrors.map((error, index) => (
                      <div key={index} className="error-message">
                        ⚠️ {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="threshold-settings">
                {/* 경고 범위 설정 */}
                <div className="threshold-group warning">
                  <label>⚠️ 경고 범위 (Warning)</label>
                  <div className="range-inputs">
                    <input
                      type="number"
                      placeholder="최소값"
                      value={config.warning.min}
                      onChange={(e) => handleThresholdChange(sensorType, 'warning', 'min', e.target.value)}
                      className="threshold-input"
                    />
                    <span className="range-separator">~</span>
                    <input
                      type="number"
                      placeholder="최대값"
                      value={config.warning.max}
                      onChange={(e) => handleThresholdChange(sensorType, 'warning', 'max', e.target.value)}
                      className="threshold-input"
                    />
                    <span className="unit-label">{info.unit}</span>
                  </div>
                </div>

                {/* 위험 범위 설정 */}
                <div className="threshold-group alert">
                  <label>🚨 위험 범위 (Alert)</label>
                  <div className="range-inputs">
                    <input
                      type="number"
                      placeholder="최소값"
                      value={config.alert.min}
                      onChange={(e) => handleThresholdChange(sensorType, 'alert', 'min', e.target.value)}
                      className="threshold-input"
                    />
                    <span className="range-separator">~</span>
                    <input
                      type="number"
                      placeholder="최대값"
                      value={config.alert.max}
                      onChange={(e) => handleThresholdChange(sensorType, 'alert', 'max', e.target.value)}
                      className="threshold-input"
                    />
                    <span className="unit-label">{info.unit}</span>
                  </div>
                </div>

                {/* 오프라인 타임아웃 설정 */}
                <div className="threshold-group timeout">
                  <label>📵 오프라인 판정 시간</label>
                  <div className="timeout-input">
                    <input
                      type="number"
                      placeholder="시간"
                      value={config.offline_timeout / 1000}
                      onChange={(e) => handleTimeoutChange(sensorType, e.target.value)}
                      className="threshold-input"
                      min="10"
                      max="3600"
                    />
                    <span className="unit-label">초</span>
                  </div>
                  <p className="timeout-description">
                    지정된 시간 동안 데이터가 수신되지 않으면 오프라인으로 판정
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="threshold-actions">
        <button
          className="btn btn-secondary"
          onClick={handleReset}
          disabled={isSaving}
          title="모든 센서의 임계값을 기본값으로 초기화"
        >
          🔄 전체 초기화
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          ❌ 취소
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '⏳ 저장 중...' : '💾 저장'}
        </button>
      </div>

    </div>
  )
}

export default ThresholdConfig