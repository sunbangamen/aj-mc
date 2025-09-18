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
    sensorCount: 1,
    sensorTypes: ['ultrasonic'],
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
      setFormData({
        ...formData,
        ...initialData
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

    if (formData.sensorCount < 1) {
      newErrors.sensorCount = '센서 개수는 1개 이상이어야 합니다.'
    } else if (formData.sensorCount > 10) {
      newErrors.sensorCount = '센서 개수는 10개 이하로 설정해주세요.'
    }

    if (formData.sensorTypes.length === 0) {
      newErrors.sensorTypes = '최소 1개의 센서 타입을 선택해주세요.'
    }

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

  // 센서 타입 체크박스 처리
  const handleSensorTypeChange = (sensorType, checked) => {
    let newSensorTypes
    if (checked) {
      newSensorTypes = [...formData.sensorTypes, sensorType]
    } else {
      newSensorTypes = formData.sensorTypes.filter(type => type !== sensorType)
    }

    handleInputChange('sensorTypes', newSensorTypes)
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
      sensorCount: parseInt(formData.sensorCount)
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

      {/* 센서 개수 */}
      <div className="form-group">
        <label htmlFor="sensorCount" className="form-label">
          센서 개수 <span className="required">*</span>
        </label>
        <input
          type="number"
          id="sensorCount"
          className={`form-input ${errors.sensorCount ? 'error' : ''}`}
          value={formData.sensorCount}
          onChange={(e) => handleInputChange('sensorCount', e.target.value)}
          min="1"
          max="10"
          disabled={isLoading}
        />
        {errors.sensorCount && <div className="form-error">{errors.sensorCount}</div>}
      </div>

      {/* 센서 타입 */}
      <div className="form-group">
        <label className="form-label">
          센서 타입 <span className="required">*</span>
        </label>
        <div className="sensor-types-grid">
          {availableSensorTypes.map(sensorType => (
            <label key={sensorType} className="sensor-type-checkbox">
              <input
                type="checkbox"
                checked={formData.sensorTypes.includes(sensorType)}
                onChange={(e) => handleSensorTypeChange(sensorType, e.target.checked)}
                disabled={isLoading}
              />
              <span className="sensor-type-label">
                <span className="sensor-icon">
                  {SENSOR_TYPE_ICONS[sensorType]}
                </span>
                {SENSOR_TYPE_LABELS[sensorType]}
              </span>
            </label>
          ))}
        </div>
        {errors.sensorTypes && <div className="form-error">{errors.sensorTypes}</div>}
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