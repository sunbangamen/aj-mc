import React, { useState, useEffect } from 'react'
import {
  SENSOR_TYPE_LABELS,
  SENSOR_TYPE_ICONS,
  SITE_STATUS_LABELS,
  DEFAULT_SITE_TEMPLATE
} from '../types/site'

function SiteForm({
  initialData = null,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create' // 'create' or 'edit'
}) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    sensorConfig: {
      ultrasonic: 1,
      temperature: 0,
      humidity: 0,
      pressure: 0
    },
    status: 'active',
    ...DEFAULT_SITE_TEMPLATE
  })
  const [errors, setErrors] = useState({})
  const [availableSensorTypes] = useState([
    'ultrasonic',
    'temperature',
    'humidity',
    'pressure'
  ])

  // 초기 데이터 설정 (편집 모드)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      const sensorConfig = {
        ultrasonic: 0,
        temperature: 0,
        humidity: 0,
        pressure: 0,
        ...initialData.sensorConfig
      }

      setFormData({
        ...formData,
        ...initialData,
        sensorConfig
      })
    }
  }, [initialData, mode])

  // 폼 검증 함수
  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '현장명을 입력해주세요.'
    } else if (formData.name.length < 2) {
      newErrors.name = '현장명은 2자 이상 입력해주세요.'
    }

    if (!formData.location.trim()) {
      newErrors.location = '현장 위치를 입력해주세요.'
    }

    const totalSensors = Object.values(formData.sensorConfig).reduce((sum, count) => sum + count, 0)

    if (totalSensors < 1) {
      newErrors.sensorConfig = '최소 1개의 센서를 설정해주세요.'
    } else if (totalSensors > 20) {
      newErrors.sensorConfig = '전체 센서 개수는 20개 이하로 설정해주세요.'
    }

    // 각 센서 타입별 개수 검증
    Object.entries(formData.sensorConfig).forEach(([type, count]) => {
      if (count > 10) {
        newErrors[`sensor_${type}`] = `${SENSOR_TYPE_LABELS[type]} 센서는 10개 이하로 설정해주세요.`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 입력값 변경 처리
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // 센서 개수 변경 처리
  const handleSensorCountChange = (sensorType, count) => {
    const newSensorConfig = {
      ...formData.sensorConfig,
      [sensorType]: Math.max(0, parseInt(count) || 0)
    }

    handleInputChange('sensorConfig', newSensorConfig)

    // 해당 센서 타입 에러 초기화
    if (errors[`sensor_${sensorType}`]) {
      setErrors(prev => ({
        ...prev,
        [`sensor_${sensorType}`]: ''
      }))
    }
  }

  // 폼 제출 처리
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // 데이터 정리
    const submitData = {
      ...formData,
      name: formData.name.trim(),
      location: formData.location.trim(),
      description: formData.description.trim(),
      sensorConfig: formData.sensorConfig
    }

    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="site-form">
      {/* 현장명 */}
      <div className="form-group">
        <label htmlFor="name" className="form-label">
          현장명 <span className="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          className={`form-input ${errors.name ? 'error' : ''}`}
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="예: 강남 건설현장"
          disabled={isLoading}
        />
        {errors.name && <div className="form-error">{errors.name}</div>}
      </div>

      {/* 현장 위치 */}
      <div className="form-group">
        <label htmlFor="location" className="form-label">
          현장 위치 <span className="required">*</span>
        </label>
        <input
          type="text"
          id="location"
          className={`form-input ${errors.location ? 'error' : ''}`}
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          placeholder="예: 서울시 강남구 테헤란로 123"
          disabled={isLoading}
        />
        {errors.location && <div className="form-error">{errors.location}</div>}
      </div>

      {/* 현장 설명 */}
      <div className="form-group">
        <label htmlFor="description" className="form-label">
          현장 설명
        </label>
        <textarea
          id="description"
          className="form-textarea"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="현장에 대한 간단한 설명을 입력하세요"
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* 센서 설정 */}
      <div className="form-group">
        <label className="form-label">
          센서 설정 <span className="required">*</span>
          <span className="form-hint">
            (전체 {Object.values(formData.sensorConfig).reduce((sum, count) => sum + count, 0)}개)
          </span>
        </label>
        <div className="sensor-config-grid">
          {availableSensorTypes.map(sensorType => (
            <div key={sensorType} className="sensor-config-item">
              <div className="sensor-config-header">
                <span className="sensor-icon">
                  {SENSOR_TYPE_ICONS[sensorType]}
                </span>
                <span className="sensor-label">
                  {SENSOR_TYPE_LABELS[sensorType]}
                </span>
              </div>
              <div className="sensor-count-input">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.sensorConfig[sensorType]}
                  onChange={(e) => handleSensorCountChange(sensorType, e.target.value)}
                  className={`form-input compact ${errors[`sensor_${sensorType}`] ? 'error' : ''}`}
                  disabled={isLoading}
                />
                <span className="unit">개</span>
              </div>
              {errors[`sensor_${sensorType}`] &&
                <div className="form-error small">{errors[`sensor_${sensorType}`]}</div>
              }
            </div>
          ))}
        </div>
        {errors.sensorConfig && <div className="form-error">{errors.sensorConfig}</div>}
      </div>

      {/* 현장 상태 (편집 모드에서만) */}
      {mode === 'edit' && (
        <div className="form-group">
          <label htmlFor="status" className="form-label">
            현장 상태
          </label>
          <select
            id="status"
            className="form-select"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            disabled={isLoading}
          >
            {Object.entries(SITE_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 폼 액션 버튼 */}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          취소
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading
            ? (mode === 'create' ? '생성 중...' : '저장 중...')
            : (mode === 'create' ? '현장 생성' : '변경 저장')
          }
        </button>
      </div>
    </form>
  )
}

export default SiteForm