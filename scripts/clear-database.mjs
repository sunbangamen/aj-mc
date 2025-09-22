#!/usr/bin/env node

/**
 * Firebase Realtime Database 초기화 스크립트
 *
 * 이 스크립트는 Firebase Realtime Database의 'sensors'와 'sites' 경로를 삭제하여
 * 데이터베이스를 초기화합니다. Firebase 설정은 그대로 유지됩니다.
 *
 * 사용법: npm run clear-db
 */

import { initializeApp } from 'firebase/app'
import { getDatabase, ref, remove } from 'firebase/database'
import * as readline from 'readline'

// .env 파일 로드
import { config } from 'dotenv'
config()

// 환경변수에서 Firebase 설정 로드
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

// Firebase 초기화
let app, database

try {
  app = initializeApp(firebaseConfig)
  database = getDatabase(app)
  console.log('✅ Firebase 연결 성공')
  console.log(`🔗 데이터베이스 URL: ${firebaseConfig.databaseURL}`)
  console.log(`📁 프로젝트 ID: ${firebaseConfig.projectId}`)
} catch (error) {
  console.error('❌ Firebase 연결 실패:', error.message)
  process.exit(1)
}

// 사용자 확인을 위한 readline 설정
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 데이터베이스 초기화 함수
async function clearDatabase() {
  try {
    console.log('\n🧹 데이터베이스 초기화 시작...')

    // 삭제할 경로들
    const pathsToDelete = ['sensors', 'sites']

    for (const path of pathsToDelete) {
      try {
        const pathRef = ref(database, path)
        await remove(pathRef)
        console.log(`✅ '/${path}' 경로 삭제 완료`)
      } catch (error) {
        console.log(`ℹ️  '/${path}' 경로 삭제 건너뜀 (데이터가 없거나 이미 삭제됨)`)
      }
    }

    console.log('\n🎉 데이터베이스 초기화 완료!')
    console.log('📊 이제 수동으로 새로운 사이트를 생성할 수 있습니다.')

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message)
    throw error
  }
}

// 확인 프롬프트
function askConfirmation() {
  return new Promise((resolve) => {
    console.log('\n⚠️  경고: 이 작업은 다음 데이터를 영구적으로 삭제합니다:')
    console.log('   • /sensors - 모든 센서 데이터')
    console.log('   • /sites - 모든 사이트 정보')
    console.log('')

    rl.question('정말로 데이터베이스를 초기화하시겠습니까? (yes/no): ', (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
    })
  })
}

// 메인 실행 함수
async function main() {
  try {
    console.log('🔥 Firebase Realtime Database 초기화 도구')
    console.log('='.repeat(50))

    const confirmed = await askConfirmation()

    if (!confirmed) {
      console.log('\n❌ 작업이 취소되었습니다.')
      rl.close()
      return
    }

    await clearDatabase()

  } catch (error) {
    console.error('\n💥 오류 발생:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

// 스크립트 실행
main()