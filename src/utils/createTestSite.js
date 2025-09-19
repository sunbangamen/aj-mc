import { ref, set, get, remove } from 'firebase/database'
import { database } from '../services/firebase'

/**
 * 테스트 사이트 자동 생성 함수
 */
export const createTestSite = async () => {
  try {
    // 이미 test 사이트가 있는지 확인
    const siteRef = ref(database, 'sites/test')
    const snapshot = await get(siteRef)

    if (snapshot.exists()) {
      console.log('✅ 테스트 사이트가 이미 존재합니다.')
      return { success: true, message: '테스트 사이트가 이미 존재합니다.' }
    }

    // 테스트 사이트 데이터 생성
    const testSiteData = {
      name: '테스트 현장',
      location: '테스트 위치',
      description: 'Firebase 연결 테스트용 현장',
      sensorCount: 1,
      sensorTypes: ['ultrasonic'],
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // Firebase에 저장
    await set(siteRef, testSiteData)

    console.log('✅ 테스트 사이트가 생성되었습니다.')
    return { success: true, message: '테스트 사이트가 생성되었습니다.' }

  } catch (error) {
    console.error('❌ 테스트 사이트 생성 오류:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 테스트 센서 데이터 생성 (이미 있으면 스킵)
 */
export const createTestSensorData = async () => {
  try {
    // 마이그레이션 대상 센서 타입들
    const types = ['ultrasonic', 'temperature', 'humidity', 'pressure']
    const results = []

    for (const type of types) {
      const legacyRef = ref(database, `sensors/test/${type}`)
      const numberedRef = ref(database, `sensors/test/${type}_1`)

      const [legacySnap, numberedSnap] = await Promise.all([
        get(legacyRef),
        get(numberedRef),
      ])

      // 1) legacy만 있으면 numbered로 이동
      if (legacySnap.exists() && !numberedSnap.exists()) {
        const data = legacySnap.val()
        await set(numberedRef, data)
        await remove(legacyRef)
        console.log(`🔁 테스트 센서 데이터를 ${type} → ${type}_1 으로 마이그레이션했습니다.`)
        results.push(`${type}: migrated to ${type}_1`)
        continue
      }

      // 2) 둘 다 존재하면 legacy 제거(표시는 numbered 기준)
      if (legacySnap.exists() && numberedSnap.exists()) {
        await remove(legacyRef)
        console.log(`🧹 레거시 ${type} 센서를 제거했습니다. (${type}_1 유지)`) 
        results.push(`${type}: legacy removed, kept ${type}_1`)
        continue
      }

      // 3) ultrasonic의 경우 아무것도 없으면 기본 생성(다른 타입은 생성하지 않음)
      if (type === 'ultrasonic' && !numberedSnap.exists() && !legacySnap.exists()) {
        const now = Date.now()
        const testSensorData = {
          distance: 75,
          status: 'normal',
          timestamp: now,
          lastUpdate: now
        }
        await set(numberedRef, testSensorData)
        console.log('✅ 테스트 센서 데이터(ultrasonic_1)가 생성되었습니다.')
        results.push('ultrasonic: created ultrasonic_1')
      }
    }

    return { success: true, message: results.join('; ') || '변경 없음' }

  } catch (error) {
    console.error('❌ 테스트 센서 데이터 생성/마이그레이션 오류:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 테스트 환경 전체 초기화
 */
export const initializeTestEnvironment = async () => {
  try {
    console.log('🚀 테스트 환경 초기화 시작...')

    const siteResult = await createTestSite()
    const sensorResult = await createTestSensorData()

    if (siteResult.success && sensorResult.success) {
      console.log('✅ 테스트 환경 초기화 완료')
      return {
        success: true,
        message: '테스트 환경이 준비되었습니다. 페이지를 새로고침해주세요.'
      }
    } else {
      throw new Error('초기화 중 오류 발생')
    }

  } catch (error) {
    console.error('❌ 테스트 환경 초기화 오류:', error)
    return { success: false, error: error.message }
  }
}
