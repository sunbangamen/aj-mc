/**
 * Phase 14E: 경고 및 임계값 시스템
 * 센서별 임계값 설정, 경고 생성, 알림 관리 기능
 */

// 실무용 센서별 상세 설정 (센서 타입별 특성 반영)
export const DEFAULT_THRESHOLDS = {
  ultrasonic: {
    warning: { min: 100, max: 199 },
    alert: { min: 200, max: 300 },
    critical: { min: 350, max: 500 }, // 즉시 대응 필요
    offline_timeout: 60000, // 1분
    duplicate_prevention: {
      warning: 15 * 60 * 1000,    // 15분
      alert: 10 * 60 * 1000,      // 10분
      critical: 3 * 60 * 1000     // 3분 (안전 우선)
    },
    sensitivity: {
      warning: 0.15,    // 15% 변화시 새 알림
      alert: 0.10,      // 10% 변화시 새 알림
      critical: 0.05    // 5% 변화도 감지
    }
  },
  temperature: {
    warning: { min: 26, max: 35 },
    alert: { min: 36, max: 50 },
    critical: { min: 55, max: 80 },
    offline_timeout: 60000, // 1분
    duplicate_prevention: {
      warning: 30 * 60 * 1000,    // 30분 (온도는 천천히 변함)
      alert: 15 * 60 * 1000,      // 15분
      critical: 5 * 60 * 1000     // 5분
    },
    sensitivity: {
      warning: 0.10,    // 10% 변화 (온도는 민감)
      alert: 0.08,      // 8% 변화
      critical: 0.03    // 3% 변화도 감지
    }
  },
  humidity: {
    warning: { min: 61, max: 80 },
    alert: { min: 81, max: 95 },
    critical: { min: 96, max: 100 },
    offline_timeout: 60000, // 1분
    duplicate_prevention: {
      warning: 60 * 60 * 1000,    // 60분 (습도는 덜 민감)
      alert: 30 * 60 * 1000,      // 30분
      critical: 10 * 60 * 1000    // 10분
    },
    sensitivity: {
      warning: 0.20,    // 20% 변화
      alert: 0.15,      // 15% 변화
      critical: 0.08    // 8% 변화
    }
  },
  pressure: {
    warning: { min: 990, max: 999 },
    alert: { min: 980, max: 989 },
    critical: { min: 950, max: 979 },
    offline_timeout: 60000, // 1분
    duplicate_prevention: {
      warning: 45 * 60 * 1000,    // 45분
      alert: 20 * 60 * 1000,      // 20분
      critical: 8 * 60 * 1000     // 8분
    },
    sensitivity: {
      warning: 0.12,    // 12% 변화
      alert: 0.08,      // 8% 변화
      critical: 0.05    // 5% 변화
    }
  }
}

// 실무용 경고 우선순위 및 타입 (3단계 위험도)
export const ALERT_TYPES = {
  THRESHOLD_WARNING: {
    level: 'warning',
    priority: 3,
    color: '#f39c12',
    icon: '⚠️',
    description: '주의 필요'
  },
  THRESHOLD_ALERT: {
    level: 'alert',
    priority: 2,
    color: '#e74c3c',
    icon: '🚨',
    description: '즉시 확인 필요'
  },
  THRESHOLD_CRITICAL: {
    level: 'critical',
    priority: 1,
    color: '#c0392b',
    icon: '🆘',
    description: '긴급 대응 필요'
  },
  SENSOR_OFFLINE: {
    level: 'offline',
    priority: 1,
    color: '#95a5a6',
    icon: '📵',
    description: '센서 연결 끊김'
  },
  BATTERY_LOW: {
    level: 'warning',
    priority: 3,
    color: '#f39c12',
    icon: '🔋',
    description: '배터리 부족'
  },
  SIGNAL_WEAK: {
    level: 'warning',
    priority: 4,
    color: '#f39c12',
    icon: '📶',
    description: '신호 약함'
  },
  MAINTENANCE_DUE: {
    level: 'info',
    priority: 5,
    color: '#3498db',
    icon: '🔧',
    description: '정비 필요'
  }
}

// 센서별 최근 알림 캐시 (메모리 효율성을 위해)
const recentAlertsCache = new Map()
const alertTimeouts = new Map()

// 초/밀리초 혼용 안전 처리
const toMillis = (ts) => {
  if (!ts || typeof ts !== 'number') return 0
  return ts > 1_000_000_000_000 ? ts : ts * 1000
}

/**
 * 센서별 중복 방지 체크
 */
const shouldCreateAlert = (sensorId, alertLevel, sensorValue, thresholds, lastAlertData) => {
  const now = Date.now()
  const preventionTime = thresholds.duplicate_prevention[alertLevel]
  const sensitivity = thresholds.sensitivity[alertLevel]

  // 최근 알림이 없으면 생성
  if (!lastAlertData) return true

  // 시간 기반 체크: 중복 방지 시간이 지났으면 생성
  if ((now - lastAlertData.timestamp) > preventionTime) return true

  // 값 변화 기반 체크: 큰 변화가 있으면 중복 방지 시간과 관계없이 생성
  if (lastAlertData.value && sensorValue) {
    const changeRatio = Math.abs(sensorValue - lastAlertData.value) / lastAlertData.value
    if (changeRatio > sensitivity) {
      console.log(`📈 큰 변화 감지: ${(changeRatio * 100).toFixed(1)}% (기준: ${(sensitivity * 100).toFixed(1)}%)`)
      return true
    }
  }

  // 위험도 상승 체크: 더 심각한 수준으로 악화되면 생성
  if (alertLevel === 'critical' && lastAlertData.level !== 'critical') return true
  if (alertLevel === 'alert' && lastAlertData.level === 'warning') return true

  return false
}

/**
 * 실무용 스마트 알림 생성 (중복 방지 + 센서별 개별 관리)
 */
export const generateAlerts = (sensorData, sensorType, siteId, sensorKey, thresholds = null) => {
  const alerts = []
  const timestamp = Date.now()
  const currentThresholds = thresholds || DEFAULT_THRESHOLDS[sensorType]

  if (!sensorData || !currentThresholds) return alerts

  // 고유 센서 식별자
  const sensorId = `${siteId}/${sensorKey}`

  // 센서 값 추출
  const sensorValue = getSensorValueFromData(sensorData, sensorType)

  // 최근 알림 데이터 가져오기
  const lastAlertData = recentAlertsCache.get(sensorId)

  // 1. 오프라인 상태 체크 (최우선, 중복 방지 무시)
  const lastUpdateMs = toMillis(sensorData.lastUpdate || sensorData.timestamp)
  const FUTURE_SKEW_MS = 120000 // 2분 허용
  const futureSkew = lastUpdateMs - timestamp
  const delta = futureSkew > FUTURE_SKEW_MS ? (currentThresholds.offline_timeout + 1) : Math.max(0, timestamp - lastUpdateMs)
  if (sensorData.status === 'offline' || delta > currentThresholds.offline_timeout) {

    // 오프라인 알림은 항상 생성 (안전 우선)
    const offlineAlert = createAlert(
      ALERT_TYPES.SENSOR_OFFLINE,
      siteId,
      sensorKey,
      '센서가 오프라인 상태입니다',
      {
        lastSeen: lastUpdateMs || timestamp,
        timeout: currentThresholds.offline_timeout
      }
    )
    alerts.push(offlineAlert)

    // 캐시 업데이트
    recentAlertsCache.set(sensorId, {
      level: 'offline',
      timestamp,
      value: null
    })
  }

  // 2. 측정값 임계값 체크 (오프라인이 아닌 경우에만)
  if (sensorData.status !== 'offline' && sensorValue !== null) {
    let alertCreated = false

    // 위험도 순서로 체크 (critical -> alert -> warning)
    if (isValueInRange(sensorValue, currentThresholds.critical)) {
      if (shouldCreateAlert(sensorId, 'critical', sensorValue, currentThresholds, lastAlertData)) {
        alerts.push(createAlert(
          ALERT_TYPES.THRESHOLD_CRITICAL,
          siteId,
          sensorKey,
          `🆘 긴급: ${sensorType} 센서 임계값 초과 (${sensorValue})`,
          { value: sensorValue, threshold: currentThresholds.critical, severity: 'critical' }
        ))
        alertCreated = true

        // 캐시 업데이트
        recentAlertsCache.set(sensorId, {
          level: 'critical',
          timestamp,
          value: sensorValue
        })
      }
    }
    else if (isValueInRange(sensorValue, currentThresholds.alert)) {
      if (shouldCreateAlert(sensorId, 'alert', sensorValue, currentThresholds, lastAlertData)) {
        alerts.push(createAlert(
          ALERT_TYPES.THRESHOLD_ALERT,
          siteId,
          sensorKey,
          `🚨 경고: ${sensorType} 센서 임계값 초과 (${sensorValue})`,
          { value: sensorValue, threshold: currentThresholds.alert, severity: 'alert' }
        ))
        alertCreated = true

        // 캐시 업데이트
        recentAlertsCache.set(sensorId, {
          level: 'alert',
          timestamp,
          value: sensorValue
        })
      }
    }
    else if (isValueInRange(sensorValue, currentThresholds.warning)) {
      if (shouldCreateAlert(sensorId, 'warning', sensorValue, currentThresholds, lastAlertData)) {
        alerts.push(createAlert(
          ALERT_TYPES.THRESHOLD_WARNING,
          siteId,
          sensorKey,
          `⚠️ 주의: ${sensorType} 센서 임계값 초과 (${sensorValue})`,
          { value: sensorValue, threshold: currentThresholds.warning, severity: 'warning' }
        ))
        alertCreated = true

        // 캐시 업데이트
        recentAlertsCache.set(sensorId, {
          level: 'warning',
          timestamp,
          value: sensorValue
        })
      }
    }
    // 정상 상태로 복귀한 경우 캐시에서 제거 (자동 해결)
    else if (lastAlertData && lastAlertData.level !== 'offline') {
      console.log(`✅ 센서 정상 복귀: ${sensorId}`)
      recentAlertsCache.delete(sensorId)
    }
  }

  // 3. 하드웨어 상태 체크 (Phase 14D 메타데이터 활용)
  if (sensorData.batteryLevel && sensorData.batteryLevel < 20) {
    alerts.push(createAlert(
      ALERT_TYPES.BATTERY_LOW,
      siteId,
      sensorKey,
      '배터리 잔량이 부족합니다',
      { batteryLevel: sensorData.batteryLevel }
    ))
  }

  if (sensorData.signalStrength && sensorData.signalStrength < -70) {
    alerts.push(createAlert(
      ALERT_TYPES.SIGNAL_WEAK,
      siteId,
      sensorKey,
      'WiFi 신호가 약합니다',
      { signalStrength: sensorData.signalStrength }
    ))
  }

  // 4. 유지보수 알림 체크
  if (sensorData.lastMaintenance) {
    const daysSinceLastMaintenance = (timestamp - sensorData.lastMaintenance) / (1000 * 60 * 60 * 24)
    if (daysSinceLastMaintenance > 90) { // 90일 이상
      alerts.push(createAlert(
        ALERT_TYPES.MAINTENANCE_DUE,
        siteId,
        sensorKey,
        '정기 점검이 필요합니다',
        { daysSince: Math.floor(daysSinceLastMaintenance) }
      ))
    }
  }

  return alerts
}

/**
 * 고유 ID 생성 헬퍼 함수
 */
const generateUniqueId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 경고 객체 생성 헬퍼 함수
 */
const createAlert = (alertType, siteId, sensorKey, message, data = {}) => {
  const uniqueId = generateUniqueId()

  // undefined 값 필터링 함수
  const cleanData = (obj) => {
    const cleaned = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && value !== null) {
          cleaned[key] = cleanData(value)
        } else {
          cleaned[key] = value
        }
      }
    }
    return cleaned
  }

  return {
    id: `${siteId}_${sensorKey}_${alertType.level}_${uniqueId}`,
    type: alertType.level,
    priority: alertType.priority,
    siteId,
    sensorKey,
    message,
    timestamp: Date.now(),
    acknowledged: false,
    ...alertType,
    data: cleanData(data)
  }
}

/**
 * 센서 데이터에서 측정값 추출
 */
const getSensorValueFromData = (sensorData, sensorType) => {
  if (sensorType.startsWith('ultrasonic')) {
    return sensorData.distance
  } else if (sensorType.startsWith('temperature')) {
    return sensorData.temperature
  } else if (sensorType.startsWith('humidity')) {
    return sensorData.humidity
  } else if (sensorType.startsWith('pressure')) {
    return sensorData.pressure
  }
  return null
}

/**
 * 값이 임계값 범위 내에 있는지 확인
 */
const isValueInRange = (value, range) => {
  if (!value || !range) return false
  return value >= range.min && value <= range.max
}

/**
 * 센서 타입별 단위 반환
 */
const getSensorUnit = (sensorType) => {
  if (sensorType.startsWith('ultrasonic')) return 'cm'
  if (sensorType.startsWith('temperature')) return '°C'
  if (sensorType.startsWith('humidity')) return '%'
  if (sensorType.startsWith('pressure')) return 'hPa'
  return ''
}

/**
 * 센서 타입별 한글명 반환
 */
const getSensorDisplayName = (sensorType) => {
  if (sensorType.startsWith('ultrasonic')) return '초음파'
  if (sensorType.startsWith('temperature')) return '온도'
  if (sensorType.startsWith('humidity')) return '습도'
  if (sensorType.startsWith('pressure')) return '압력'
  return sensorType
}

/**
 * 경고 우선순위별 정렬
 */
export const sortAlertsByPriority = (alerts) => {
  return alerts.sort((a, b) => {
    // 우선순위가 낮을수록 먼저 표시 (1이 가장 중요)
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    // 같은 우선순위면 최신 순
    return b.timestamp - a.timestamp
  })
}

/**
 * 활성 경고 필터링 (확인되지 않은 경고)
 */
export const getActiveAlerts = (alerts) => {
  return alerts.filter(alert => !alert.acknowledged)
}

/**
 * 사이트별 경고 그룹화
 */
export const groupAlertsBySite = (alerts) => {
  return alerts.reduce((groups, alert) => {
    const siteId = alert.siteId
    if (!groups[siteId]) {
      groups[siteId] = []
    }
    groups[siteId].push(alert)
    return groups
  }, {})
}

/**
 * 경고 레벨별 카운트
 */
export const getAlertCounts = (alerts) => {
  return alerts.reduce((counts, alert) => {
    counts[alert.type] = (counts[alert.type] || 0) + 1
    counts.total = (counts.total || 0) + 1
    return counts
  }, {})
}

/**
 * 경고 메시지 포맷팅
 */
export const formatAlertMessage = (alert) => {
  const timeStr = new Date(alert.timestamp).toLocaleTimeString('ko-KR')
  let message = `[${timeStr}] ${alert.message}`

  if (alert.data) {
    if (alert.data.value !== undefined) {
      message += ` (${alert.data.value}${alert.data.unit || ''})`
    }
    if (alert.data.batteryLevel !== undefined) {
      message += ` (${alert.data.batteryLevel}%)`
    }
    if (alert.data.signalStrength !== undefined) {
      message += ` (${alert.data.signalStrength}dBm)`
    }
    if (alert.data.daysSince !== undefined) {
      message += ` (${alert.data.daysSince}일 경과)`
    }
  }

  return message
}

/**
 * 임계값 설정 유효성 검증
 */
export const validateThresholds = (thresholds, sensorType) => {
  const errors = []

  if (!thresholds.warning || !thresholds.alert) {
    errors.push('warning과 alert 임계값이 모두 필요합니다')
    return errors
  }

  // 범위 유효성 검증
  if (thresholds.warning.min >= thresholds.warning.max) {
    errors.push('warning 최소값이 최대값보다 작아야 합니다')
  }

  if (thresholds.alert.min >= thresholds.alert.max) {
    errors.push('alert 최소값이 최대값보다 작아야 합니다')
  }

  // 논리적 순서 검증 (경고 < 위험)
  if (sensorType.startsWith('ultrasonic')) {
    // 초음파의 경우 거리가 클수록 위험
    if (thresholds.warning.max >= thresholds.alert.min) {
      errors.push('경고 범위와 위험 범위가 겹칩니다')
    }
  }

  return errors
}

/**
 * 실무용 히스토리 자동 정리 시스템
 */

// 정리 설정
const CLEANUP_CONFIG = {
  maxHistoryDays: 30,        // 30일 이상 된 히스토리 삭제
  maxCacheEntries: 1000,     // 캐시 최대 1000개 항목
  cleanupInterval: 24 * 60 * 60 * 1000, // 24시간마다 정리
  batchSize: 100            // 한 번에 100개씩 삭제
}

// 센서 측정 히스토리 정리 설정(테스트용 기본값: 전체 삭제)
const SENSOR_HISTORY_CLEANUP = {
  maxHistoryDays: -1,         // -1일 = 미래 데이터까지 포함하여 모든 히스토리 삭제
  batchSize: 200              // 멀티로케이션 업데이트 200개 단위
}

/**
 * 오래된 알림 히스토리 정리 (Firebase에서)
 */
export const cleanupAlertHistory = async (database) => {
  try {
    const now = Date.now()
    const cutoffTime = now - (CLEANUP_CONFIG.maxHistoryDays * 24 * 60 * 60 * 1000)

    console.log(`🧹 알림 히스토리 정리 시작 (${CLEANUP_CONFIG.maxHistoryDays}일 이전)`)

    // Firebase에서 히스토리 데이터 가져오기
    const { ref, get, remove } = await import('firebase/database')
    const historyRef = ref(database, 'alerts/history')
    const snapshot = await get(historyRef)

    if (!snapshot.exists()) {
      console.log('📄 삭제할 히스토리가 없습니다')
      return { deleted: 0, kept: 0 }
    }

    const historyData = snapshot.val()
    let deletedCount = 0
    let keptCount = 0
    const deletePromises = []

    // 오래된 항목 찾아서 삭제
    Object.entries(historyData).forEach(([alertId, alertData]) => {
      if (alertData.timestamp < cutoffTime) {
        // 배치로 삭제하기 위해 Promise 저장
        const alertRef = ref(database, `alerts/history/${alertId}`)
        deletePromises.push(remove(alertRef))
        deletedCount++

        // 배치 크기만큼 모이면 실행
        if (deletePromises.length >= CLEANUP_CONFIG.batchSize) {
          Promise.all(deletePromises.splice(0, CLEANUP_CONFIG.batchSize))
        }
      } else {
        keptCount++
      }
    })

    // 남은 삭제 작업 실행
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises)
    }

    console.log(`✅ 히스토리 정리 완료: ${deletedCount}개 삭제, ${keptCount}개 보존`)

    return { deleted: deletedCount, kept: keptCount }
  } catch (error) {
    console.error('❌ 히스토리 정리 오류:', error)
    return { deleted: 0, kept: 0, error: error.message }
  }
}

/**
 * 센서 측정 히스토리 정리 (sensors/{siteId}/{sensorKey}/history)
 * - 오래된 timestamp 키를 배치로 null 업데이트(멀티 로케이션)하여 삭제
 */
export const cleanupSensorHistory = async (database, options = {}) => {
  const cfg = {
    ...SENSOR_HISTORY_CLEANUP,
    ...options
  }

  try {
    const now = Date.now()
    const cutoffTime = now - (cfg.maxHistoryDays * 24 * 60 * 60 * 1000)

    console.log(`🧹 센서 측정 히스토리 정리 시작 (${cfg.maxHistoryDays}일 이전)`)

    const { ref, get, update } = await import('firebase/database')

    const sensorsRootRef = ref(database, 'sensors')
    const sensorsRootSnap = await get(sensorsRootRef)
    if (!sensorsRootSnap.exists()) {
      console.log('📄 센서 데이터가 없어 정리를 건너뜁니다')
      return { deleted: 0, kept: 0 }
    }

    const sensorsRoot = sensorsRootSnap.val() || {}

    let deletedCount = 0
    let keptCount = 0
    let batchUpdates = {}
    let batchSize = 0

    const flushBatch = async () => {
      if (batchSize === 0) return
      const rootRef = ref(database)
      await update(rootRef, batchUpdates)
      batchUpdates = {}
      batchSize = 0
    }

    // siteId 단위 순회
    for (const [siteId, siteNode] of Object.entries(sensorsRoot)) {
      if (!siteNode || typeof siteNode !== 'object') continue
      // 각 센서 키 순회 (history 제외)
      for (const [sensorKey, sensorNode] of Object.entries(siteNode)) {
        if (!sensorNode || typeof sensorNode !== 'object') continue
        const history = sensorNode.history
        if (!history || typeof history !== 'object') continue

        // 전체 히스토리 삭제 (시간 비교 없이)
        for (const [tsKey, entry] of Object.entries(history)) {
          if (cfg.maxHistoryDays < 0) {
            // 전체 삭제 모드: 시간 비교 없이 모든 히스토리 삭제
            const path = `sensors/${siteId}/${sensorKey}/history/${tsKey}`
            batchUpdates[path] = null
            batchSize++
            deletedCount++
            if (batchSize >= cfg.batchSize) {
              await flushBatch()
            }
          } else {
            // 기존 시간 기반 삭제 로직
            const parsed = parseInt(tsKey, 10)
            if (!Number.isFinite(parsed)) { keptCount++; continue }
            const tsMs = parsed > 1_000_000_000_000 ? parsed : parsed * 1000
            const entryTsMs = (entry && typeof entry.timestamp === 'number')
              ? (entry.timestamp > 1_000_000_000_000 ? entry.timestamp : entry.timestamp * 1000)
              : tsMs
            if (entryTsMs < cutoffTime) {
              const path = `sensors/${siteId}/${sensorKey}/history/${tsKey}`
              batchUpdates[path] = null
              batchSize++
              deletedCount++
              if (batchSize >= cfg.batchSize) {
                await flushBatch()
              }
            } else {
              keptCount++
            }
          }
        }
      }
    }

    // 남은 배치 처리
    await flushBatch()

    console.log(`✅ 센서 히스토리 정리 완료: ${deletedCount}개 삭제, ${keptCount}개 보존`)
    return { deleted: deletedCount, kept: keptCount }
  } catch (error) {
    console.error('❌ 센서 히스토리 정리 오류:', error)
    return { deleted: 0, kept: 0, error: error.message }
  }
}

/**
 * 메모리 캐시 정리 (성능 최적화)
 */
export const cleanupMemoryCache = () => {
  const now = Date.now()
  const maxAge = 60 * 60 * 1000 // 1시간
  let cleanedCount = 0

  // 오래된 캐시 항목 제거
  for (const [sensorId, alertData] of recentAlertsCache.entries()) {
    if ((now - alertData.timestamp) > maxAge) {
      recentAlertsCache.delete(sensorId)
      cleanedCount++
    }
  }

  // 캐시 크기 제한
  if (recentAlertsCache.size > CLEANUP_CONFIG.maxCacheEntries) {
    const entriesToDelete = recentAlertsCache.size - CLEANUP_CONFIG.maxCacheEntries
    const entries = Array.from(recentAlertsCache.entries())

    // 가장 오래된 항목부터 삭제
    entries
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, entriesToDelete)
      .forEach(([sensorId]) => {
        recentAlertsCache.delete(sensorId)
        cleanedCount++
      })
  }

  if (cleanedCount > 0) {
    console.log(`🧹 메모리 캐시 정리: ${cleanedCount}개 항목 제거`)
  }

  return cleanedCount
}

/**
 * 정기적 자동 정리 스케줄러
 */
let cleanupTimer = null

export const startAutoCleanup = (database) => {
  // 기존 타이머가 있으면 제거
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
  }

  // 정기적 정리 시작
  cleanupTimer = setInterval(async () => {
    try {
      console.log('🕐 정기 알림 시스템 정리 시작')

      // Firebase 히스토리 정리
      const historyResult = await cleanupAlertHistory(database)

      // 센서 측정 히스토리 정리
      const sensorHistoryResult = await cleanupSensorHistory(database)

      // 메모리 캐시 정리
      const cacheResult = cleanupMemoryCache()

      console.log(`📊 정리 완료 - 알림: ${historyResult.deleted}개, 센서: ${sensorHistoryResult.deleted}개, 캐시: ${cacheResult}개`)

    } catch (error) {
      console.error('❌ 자동 정리 오류:', error)
    }
  }, CLEANUP_CONFIG.cleanupInterval)

  // 즉시 한 번 실행
  setTimeout(() => {
    cleanupMemoryCache()
    // 초기 실행에서 센서 히스토리도 한 번 정리(가벼운 데이터 기준)
    cleanupSensorHistory(database, { maxHistoryDays: SENSOR_HISTORY_CLEANUP.maxHistoryDays }).catch(() => {})
  }, 5000) // 5초 후 첫 정리

  console.log(`🚀 자동 정리 스케줄러 시작 (${CLEANUP_CONFIG.cleanupInterval / 1000 / 60 / 60}시간마다)`)
}

/**
 * 자동 정리 중지
 */
export const stopAutoCleanup = () => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
    console.log('⏹️ 자동 정리 스케줄러 중지')
  }
}

/**
 * 캐시 상태 조회 (디버깅용)
 */
export const getCacheStatus = () => {
  return {
    cacheSize: recentAlertsCache.size,
    maxEntries: CLEANUP_CONFIG.maxCacheEntries,
    entries: Array.from(recentAlertsCache.entries()).map(([sensorId, data]) => ({
      sensorId,
      level: data.level,
      timestamp: data.timestamp,
      age: Date.now() - data.timestamp
    }))
  }
}
