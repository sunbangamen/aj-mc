# 📋 Phase 1 개발 계획 - 프로젝트 기반 환경 구축 (보강판)

**문서**: Phase 1 Feature Breakdown
**작성일**: 2025-09-17
**버전**: v1.1 (보강판)
**기반 문서**: `docs/v1/web_execution_plan.md`

---

## 문제 분석

### 1. 문제 정의 및 복잡성 평가

* **문제**: 관제모니터링 시스템 MVP를 위한 Phase 1 환경 구축 (Vite React + Firebase 프로젝트 기반 설정)
* **복잡성 수준**: 중간
* **예상 소요 시간**: 1-2일 (4-8시간)
* **주요 도전 과제**: Firebase 설정, 환경변수 관리, 프로젝트 구조 설계, 모바일 대응 초기 세팅

### 2. 범위 및 제약조건

* **포함 범위**:

  * Vite React 프로젝트 초기화
  * Firebase 프로젝트 설정 및 연동
  * 개발 환경 구축
  * 기본 프로젝트 구조 확립
  * ESLint/Prettier 설정
  * 환경변수 검증 스크립트 추가
  * Firebase 개발용 보안 규칙 적용
* **제외 범위**: 실제 컴포넌트 개발, UI 구현
* **제약조건**: WSL Ubuntu 환경, Firebase 무료 플랜 제한
* **전제조건**: Node.js, npm, git 설치 완료

---

## 작업 분해

### Phase 1.1: 저장소 및 프로젝트 초기화

**목표**: Git 기반 프로젝트 환경 구축

| 작업                 | 설명                                  | 완료 기준 (DoD)                         | 우선순위 |
| ------------------ | ----------------------------------- | ----------------------------------- | ---- |
| Git 저장소 초기화        | 현재 디렉토리를 git 저장소로 설정                | `.git` 폴더 생성, 초기 커밋 완료              | 높음   |
| .gitignore 생성      | Node.js, Firebase, 환경변수 제외 설정       | `.gitignore` 파일 생성, 필수 패턴 포함        | 높음   |
| Vite React 프로젝트 생성 | `npm create vite` 명령으로 React 템플릿 생성 | `package.json`, `vite.config.js` 생성 | 높음   |
| 기본 프로젝트 구조 확인      | 생성된 파일 구조 검증 및 정리                   | 표준 React 프로젝트 구조 확립                 | 중간   |

### Phase 1.2: 의존성 설치 및 설정

**목표**: 필요한 라이브러리 설치 및 개발 도구 구성

| 작업           | 설명                                  | 완료 기준 (DoD)                          | 의존성         |
| ------------ | ----------------------------------- | ------------------------------------ | ----------- |
| 핵심 의존성 설치    | Firebase, React Router, Recharts 설치 | `package.json`에 의존성 추가               | Git 저장소 초기화 |
| 개발 도구 설치     | ESLint, Prettier 개발 의존성 설치          | `.eslintrc.cjs`, `.prettierrc` 파일 생성 | 핵심 의존성 설치   |
| 패키지 잠금 파일 관리 | `package-lock.json` 커밋              | 의존성 버전 고정                            | 의존성 설치 완료   |

### Phase 1.3: Firebase 프로젝트 설정

**목표**: Firebase 클라우드 서비스 설정 및 연동

| 작업                    | 설명                           | 완료 기준 (DoD)                 | 위험도 |
| --------------------- | ---------------------------- | --------------------------- | --- |
| Firebase 프로젝트 생성      | Firebase Console에서 새 프로젝트 생성 | 프로젝트 ID 발급, 설정 완료           | 낮음  |
| Realtime Database 활성화 | 실시간 데이터베이스 서비스 활성화           | DB URL 생성, **개발용 보안 규칙 적용** | 중간  |
| Firebase Hosting 설정   | 웹 호스팅 서비스 활성화                | 도메인 할당, 배포 설정               | 낮음  |
| Firebase CLI 설치 및 로그인 | 로컬 개발환경에 Firebase CLI 설정     | `firebase login` 성공         | 중간  |

### Phase 1.4: 환경 파일 설정

**목표**: 개발/운영 환경 분리 및 보안 설정

| 작업              | 설명                            | 완료 기준 (DoD)                   | 위험도 |
| --------------- | ----------------------------- | ----------------------------- | --- |
| .env 파일 생성      | 환경변수 템플릿 파일 생성                | `.env.example` 및 `.env` 파일 생성 | 낮음  |
| Firebase 설정값 추가 | API Key, Project ID 등 환경변수 설정 | Firebase 연결 정보 완성             | 높음  |
| Vite 환경변수 설정    | `VITE_` 접두사 환경변수 구성           | 프론트엔드에서 환경변수 접근 가능            | 중간  |
| 환경변수 검증 스크립트    | `scripts/check-env.mjs` 추가    | 키 누락 시 `npm run dev` 실패 처리    | 중간  |

### Phase 1.5: 기본 반응형 체크

**목표**: 모바일 환경에서도 접속 가능하도록 최소 대응

| 작업             | 설명                                            | 완료 기준 (DoD)           |
| -------------- | --------------------------------------------- | --------------------- |
| Vite 서버 외부 호스트 | `vite.config.js`에 `server: { host: true }` 설정 | 동일 Wi-Fi의 휴대폰에서 접속 가능 |
| 뷰포트/폰트 기본 CSS  | `src/styles/global.css` 작성                    | 모바일에서 기본 화면 정상 표시     |

---

## 실행 계획

### 우선순위 매트릭스

```
긴급 & 중요           | 중요하지만 덜 긴급
--------------------|------------------
Git 저장소 초기화      | ESLint/Prettier 설정
Vite 프로젝트 생성     | Firebase Hosting 설정
핵심 의존성 설치       | 환경변수 검증 스크립트

긴급하지만           | 덜 중요 & 덜 긴급
덜 중요             |
Firebase CLI 설치    | 모바일 CSS 베이스
```

### 마일스톤

* **Day 1 오전**: Phase 1.1-1.2 완료 (프로젝트 초기화 및 의존성)
* **Day 1 오후**: Phase 1.3 완료 (Firebase 설정)
* **Day 2 오전**: Phase 1.4 완료 (환경 설정)
* **Day 2 오후**: Phase 1.5 완료 (모바일 대응 체크) + 통합 테스트

### 위험 요소 및 대응 방안

| 위험 요소          | 가능성 | 영향도 | 대응 방안                                    |
| -------------- | --- | --- | ---------------------------------------- |
| Firebase 설정 오류 | 중간  | 높음  | Firebase 공식 문서 참조, 단계별 검증                |
| WSL 환경 호환성 문제  | 낮음  | 중간  | Docker 컨테이너 대안 준비                        |
| 의존성 충돌         | 낮음  | 중간  | 패키지 버전 고정, npm audit 실행                  |
| 환경변수 노출        | 중간  | 높음  | .env 파일 .gitignore 추가, check-env 스크립트 적용 |
| 모바일 접속 불가      | 중간  | 중간  | `vite --host` 옵션 확인, 방화벽 체크              |

---

## 상세 구현 단계

### 🔧 Step-by-Step 실행 명령어

#### 1단계: Git 및 프로젝트 초기화

```bash
# Git 저장소 초기화
git init

# Vite React 프로젝트 생성
npm create vite@latest . -- --template react

# .gitignore 생성
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
/.pnp
.pnp.js

# Production
/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
EOF
```

#### 2단계: 의존성 설치

```bash
# 패키지 설치
npm install

# Firebase 및 라우팅 라이브러리 설치
npm install firebase react-router-dom recharts

# 개발 도구 설치
npm install -D eslint prettier eslint-config-prettier

# Firebase CLI 전역 설치 (필요시)
npm install -g firebase-tools
```

#### 3단계: Firebase 프로젝트 설정

```bash
# Firebase 로그인
firebase login --no-localhost

# Firebase 프로젝트 초기화
firebase init

# 선택 옵션:
# - Hosting (배포용)
# - Realtime Database (데이터 저장용)
```

**개발용 보안 규칙** (Realtime DB)

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ Phase 2에서 인증 기반 규칙으로 전환 필수.

#### 4단계: 환경 파일 설정

```bash
# .env 파일 생성
cat > .env << 'EOF'
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
EOF

# .env.example 템플릿 생성
cp .env .env.example
# .env.example에서 실제 값들을 placeholder로 변경
```

#### 5단계: 환경변수 검증 스크립트

`scripts/check-env.mjs`

```js
const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing env keys:', missing.join(', '));
  process.exit(1);
} else {
  console.log('✅ Env OK');
}
```

`package.json`에 추가:

```json
{
  "scripts": {
    "dev": "node -r dotenv/config scripts/check-env.mjs && vite",
    "format": "prettier -w .",
    "lint": "eslint \"src/**/*.{js,jsx}\""
  }
}
```

#### 6단계: ESLint/Prettier 최소 설정

`.eslintrc.cjs`

```js
module.exports = {
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.0' } },
  plugins: ['react'],
  rules: { 'react/prop-types': 'off' }
};
```

`.prettierrc`

```json
{ "singleQuote": true, "semi": true, "printWidth": 100 }
```

#### 7단계: 모바일 대응 체크

`src/styles/global.css`

```css
:root { --maxw: 1080px; }
* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
.container { max-width: var(--maxw); margin: 0 auto; padding: 16px; }
@media (max-width: 600px) {
  .container { padding: 12px; }
}
```

`src/App.jsx`

```jsx
export default function App() {
  return (
    <div className="container">
      <h1>Ultrasonic Monitor (MVP)</h1>
      <p>Phase 1: setup complete</p>
    </div>
  );
}
```

---

## 품질 체크리스트

### 각 작업 완료 시 확인사항

* [ ] **Git 커밋**: 각 단계별 의미있는 메시지로 커밋
* [ ] **파일 권한**: 실행 파일에 적절한 권한 설정
* [ ] **의존성 검증**: `npm audit` 실행하여 보안 취약점 확인
* [ ] **환경변수 보안**: `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
* [ ] **문서 업데이트**: README.md에 설치/실행 방법 기록
* [ ] **모바일 접속 확인**: 동일 네트워크의 스마트폰에서 접속 가능

### 전체 완료 기준 (DoD)

* [ ] `npm run dev` 실행 시 PC/모바일 모두에서 기본 페이지 표시
* [ ] Firebase 프로젝트와 로컬 환경 연결 확인
* [ ] 필수 패키지 설치 및 `package-lock.json` 생성
* [ ] `.env` 키 누락 시 실행 실패 처리됨(check-env)
* [ ] ESLint/Prettier로 코드 포맷/린트 정상 동작
* [ ] 초기 브랜치 전략(`main` 보호, `feat/phase-1-setup`) 적용

---

## 리소스 및 참고자료

* [Vite 공식 문서](https://vitejs.dev/guide/)
* [Firebase 시작 가이드](https://firebase.google.com/docs/web/setup)
* [React Router v6 문서](https://reactrouter.com/)
* [Recharts 예제](https://recharts.org/en-US/examples)

---

## 🚀 Next Steps

1. Git 저장소 초기화 및 Vite 프로젝트 생성
2. Firebase Console에서 프로젝트 생성 및 DB 규칙 dev 모드 적용
3. 의존성 설치 + ESLint/Prettier 설정 적용
4. `.env` 및 check-env 스크립트 반영
5. 모바일 실기 접속 확인

**예상 완료 시점**: 2일 내 Phase 1 완료 후 Phase 2 (Firebase 연동 및 데이터 구조) 진행 가능

---

## 문서 관리

* **상위 계획**: `docs/v1/web_execution_plan.md`
* **다음 단계**: Phase 2 Firebase 연동 계획 (예정)
* **프로젝트 개요**: `docs/v1/web_mvp.md`, `docs/v1/web_prd.md`

**업데이트 이력**:

* v1.0 (2025-09-17): 초기 Phase 1 개발 계획 수립
* v1.1 (2025-09-17): Firebase dev 규칙, 환경변수 검증, ESLint/Prettier, 모바일 대응 추가
