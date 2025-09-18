import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

function checkEnvVariables() {
  console.log('🔍 환경변수 검증을 시작합니다...')

  const envPath = join(__dirname, '..', '.env')
  let envContent

  try {
    envContent = readFileSync(envPath, 'utf8')
  } catch (error) {
    console.error('❌ .env 파일을 찾을 수 없습니다.')
    console.error('   .env.example을 복사하여 .env 파일을 생성하세요.')
    process.exit(1)
  }

  const envLines = envContent.split('\n')
  const envVars = {}

  // .env 파일 파싱
  envLines.forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    }
  })

  const missingVars = []
  const emptyVars = []

  requiredEnvVars.forEach(varName => {
    if (!(varName in envVars)) {
      missingVars.push(varName)
    } else if (!envVars[varName] || envVars[varName].length === 0) {
      emptyVars.push(varName)
    }
  })

  if (missingVars.length > 0) {
    console.error('❌ 누락된 환경변수:')
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`)
    })
  }

  if (emptyVars.length > 0) {
    console.error('❌ 값이 비어있는 환경변수:')
    emptyVars.forEach(varName => {
      console.error(`   - ${varName}`)
    })
  }

  if (missingVars.length > 0 || emptyVars.length > 0) {
    console.error('\n💡 Firebase Console에서 설정 정보를 복사하여 .env 파일에 추가하세요.')
    process.exit(1)
  }

  console.log('✅ 모든 환경변수가 올바르게 설정되었습니다.')
  console.log('📋 설정된 환경변수:')
  requiredEnvVars.forEach(varName => {
    const value = envVars[varName]
    const maskedValue = value.length > 10
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : '***'
    console.log(`   ✓ ${varName}: ${maskedValue}`)
  })
}

checkEnvVariables()