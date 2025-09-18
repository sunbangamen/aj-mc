import { ref, set, get } from 'firebase/database'
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
    const sensorRef = ref(database, 'sensors/test/ultrasonic')
    const snapshot = await get(sensorRef)

    if (snapshot.exists()) {
      console.log('✅ 테스트 센서 데이터가 이미 존재합니다.')
      return { success: true, message: '테스트 센서 데이터가 이미 존재합니다.' }
    }

    // 기본 센서 데이터 생성
    const testSensorData = {
      distance: 75,
      status: 'normal',
      timestamp: Date.now(),
      lastUpdate: Date.now()
    }

    await set(sensorRef, testSensorData)

    console.log('✅ 테스트 센서 데이터가 생성되었습니다.')
    return { success: true, message: '테스트 센서 데이터가 생성되었습니다.' }

  } catch (error) {
    console.error('❌ 테스트 센서 데이터 생성 오류:', error)
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