# 🚀 관제모니터링 시스템 MVP 실행 계획 (축소판)

## 📋 전체 개요

**목표**: Firebase 기반 초음파 센서 관제모니터링 시스템 MVP 구축  
**예상 기간**: 2-3일  
**핵심 목표**: 실시간 다중 현장 모니터링 + 모바일/PC에서 모두 확인 가능  

---

## Phase 1: 프로젝트 기반 환경 구축 🔧

### 1.1 저장소 및 프로젝트 초기화
- [ ] Git 저장소 초기화
- [ ] .gitignore 생성 (Node.js, Firebase, 환경변수)
- [ ] Vite React 프로젝트 생성
- [ ] 기본 프로젝트 구조 확인

### 1.2 의존성 설치
```bash
npm create vite@latest . -- --template react
npm install firebase react-router-dom recharts
npm install -D eslint prettier
1.3 Firebase 프로젝트 설정
 Firebase 프로젝트 생성 (Console)

 Realtime Database 활성화

 Firebase Hosting 설정

 Firebase CLI 설치 및 로그인

1.4 환경 파일 설정
 .env 파일 생성

 Firebase 설정값 추가

 Vite 환경변수 설정

완료 기준: npm run dev 실행 시 기본 React 앱 정상 동작

Phase 2: Firebase 연동 및 데이터 구조 구축 🔥
2.1 Firebase 서비스 설정
 src/services/firebase.js 생성

 Firebase SDK 초기화

 Realtime Database 연결 설정

 연결 테스트 함수 작성

2.2 데이터 구조 설계 및 테스트 데이터
javascript
코드 복사
/sensors/
├── site1/ultrasonic/
│   ├── distance: 150
│   ├── timestamp: 1694962800000
│   └── status: "normal"
├── site2/ultrasonic/
└── test/ultrasonic/
 Firebase Console에서 테스트 데이터 생성

 각 현장별 샘플 데이터 추가

 데이터 읽기 테스트

2.3 커스텀 훅 개발
 src/hooks/useSensorData.js 생성

 실시간 데이터 수신 훅 구현 (onValue)

 다중 현장 데이터 관리 로직

 에러 처리 및 로딩 상태 관리

완료 기준: Firebase 실시간 데이터 수신 확인

Phase 3: 라우팅 및 기본 컴포넌트 구조 🗂️
3.1 React Router 설정
 src/App.js 라우터 설정

 페이지별 라우트 정의:

/ - Dashboard

/site/:siteId - SiteMonitor

/test - TestPanel

3.2 기본 레이아웃 컴포넌트
 src/components/Layout.js 생성

 네비게이션 바 구현

 공통 헤더/푸터 설정

 반응형 레이아웃 기본 구조 (모바일/데스크톱 대응)

3.3 페이지 컴포넌트 골격
 src/components/Dashboard.js 생성

 src/components/SiteMonitor.js 생성

 src/components/TestPanel.js 생성

 기본 라우팅 테스트

완료 기준: 모든 페이지 간 네비게이션 정상 동작

Phase 4: 메인 대시보드 개발 📊
4.1 Dashboard 컴포넌트 구현
 전체 현장 상태 요약 카드

 현장별 최신 거리값 표시

 상태별 색상 코딩 시스템:

🟢 정상 (< 100cm)

🟡 주의 (100-200cm)

🔴 경고 (> 200cm)

⚫ 오프라인

4.2 실시간 업데이트 구현
 Firebase onValue 리스너 연결

 자동 UI 업데이트 (새로고침 없이)

 연결 상태 표시

 에러 처리 및 재연결 로직

4.3 공통 UI 컴포넌트
 src/components/common/SensorCard.js

 src/components/common/StatusBadge.js

 src/components/common/LoadingSpinner.js

완료 기준: 대시보드에서 모든 현장의 실시간 데이터 확인

Phase 5: 현장별 상세 모니터링 개발 🔍
5.1 SiteMonitor 페이지 구현
 URL 파라미터로 현장 ID 받기

 현재 거리값 대형 표시 (폰트 크기 48px+)

 현장명 및 기본 정보 표시

 실시간 업데이트 연동

5.2 측정 로그 시스템
 최근 20개 측정 데이터 표시

 시간순 정렬 (최신순)

 테이블 형태로 구성:

시간 | 거리값 | 상태

 모바일에서 스크롤로 확인 가능하게 구현

5.3 데이터 시각화
 src/components/SensorChart.js 생성

 Recharts를 이용한 실시간 차트

 시간대별 거리값 변화 그래프

 차트 실시간 업데이트

 모바일 환경에서도 잘 보이도록 반응형 설정

완료 기준: 개별 현장의 상세 정보 및 차트 정상 표시

🎯 성공 기준 (AC)
 웹 접속 시 1초 이내 최신값 표시

 Firebase 값 변경 후 500ms 이내 UI 반영

 최근 20개 데이터 시간순 표시

 데스크톱/모바일 양쪽에서 UI 정상 표시

📱 반응형/모바일 고려사항
대형 관제실 화면 = 데스크톱 최적화

휴대폰 확인 = 모바일 레이아웃 자동 전환

구현 방식:

CSS Grid/Flexbox

미디어쿼리(@media) 활용

차트와 테이블은 모바일에서 세로 스크롤 방식으로 표시

문서 버전: v1.1 (MVP 축소판 + 모바일 대응)
작성일: 2025-09-17