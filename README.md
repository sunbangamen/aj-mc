# 초음파 센서 모니터링 시스템

Firebase 기반의 실시간 초음파 센서 모니터링 웹 애플리케이션

## 🚀 개발 환경 설정

### 1. 필수 요구사항

- Node.js 18+
- npm
- Firebase Console 접근 권한

### 2. 프로젝트 설정

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 Firebase 설정값 입력

# 환경변수 검증
npm run check-env
```

### 3. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Realtime Database 활성화
3. 프로젝트 설정 → 일반 → Firebase SDK 스니펫 → 구성에서 설정값 복사
4. `.env` 파일에 설정값 입력:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4. 개발 서버 실행

```bash
npm run dev
```

- PC 접속: http://localhost:5173/
- 모바일 접속: http://[네트워크IP]:5173/ (동일 Wi-Fi 필요)

## 📝 사용 가능한 명령어

```bash
npm run dev          # 개발 서버 시작
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 결과 미리보기
npm run lint         # ESLint 코드 검사
npm run format       # Prettier 코드 포맷팅
npm run check-env    # 환경변수 검증
```

## 🏗️ 프로젝트 구조

```
src/
├── components/      # 공통 컴포넌트
├── pages/          # 페이지 컴포넌트
├── hooks/          # 커스텀 훅
├── services/       # Firebase 설정
└── types/          # 타입 정의
```

## 🔧 기술 스택

- **Frontend**: React 18 + Vite
- **Database**: Firebase Realtime Database
- **Routing**: React Router
- **Charts**: Recharts
- **Code Quality**: ESLint + Prettier
