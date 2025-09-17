

---

# 🖥️ 관제모니터링 시스템 MVP 구현 계획

## 1. 개요

**목표**: Firebase Realtime Database에 업로드된 초음파 센서 데이터를 웹에서 실시간으로 수신하고 표시한다.

**환경**: Vite + React (WSL Ubuntu 로컬 개발, Firebase Hosting 배포)

---

## 2. 시스템 구조

### 2.1 Firebase 데이터 구조
```

/sensors/
├── site1/ultrasonic/     # 현장 1 초음파 데이터
├── site2/ultrasonic/     # 현장 2 초음파 데이터
└── test/ultrasonic/      # 테스트용 데이터

```

### 2.2 페이지 구조
- `/` - 메인 대시보드 (전체 현장 최신값 요약)
- `/site/:siteId` - 개별 현장 상세 모니터링
- `/test` - 테스트 화면 (Firebase 테스트 데이터 확인)

---

## 3. 핵심 기능 요구사항

### 3.1 메인 대시보드
- 모든 현장의 최신 거리값 표시
- 현장별 상태 색상 코딩 (정상/주의/경고)

### 3.2 현장별 상세 모니터링
- 현재 거리값 대형 표시 (cm)
- 최근 20개 측정 로그 (시간순)
- 실시간 데이터 차트

### 3.3 테스트 화면
- `/test/ultrasonic` 값 변경 시 UI 반영
- Firebase 실시간 수신 확인 용도

### 3.4 실시간 기능
- Firebase `onValue` 리스너 사용
- DB 값 변경 시 자동 UI 업데이트
- 새로고침 없이 반영

---

## 4. 기술 구현 사항

### 4.1 프론트엔드 구성
- **React 18** + **Vite**
- **React Router** - 라우팅
- **Firebase SDK** - 실시간 DB 연동
- **Recharts** (또는 Chart.js) - 시각화

### 4.2 파일 구조 (MVP 최소 단위)
```

src/
├── components/
│   ├── Dashboard.js       # 메인 대시보드
│   ├── SiteMonitor.js     # 현장 모니터링
│   ├── SensorChart.js     # 차트 컴포넌트
│   └── common/            # 공통 UI 컴포넌트
├── services/
│   └── firebase.js        # Firebase 설정
├── hooks/
│   └── useSensorData.js   # 데이터 훅
└── styles/

````

### 4.3 환경 설정
- `.env` - Firebase API Key, 프로젝트 ID
- `vite.config.js` - Vite 빌드 설정
- `firebase.json` - Hosting 설정

---

## 5. 성공 기준 (AC)

- [ ] 웹 접속 시 **1초 이내 최신값** 표시  
- [ ] Firebase 값 변경 후 **500ms 이내 UI 반영**  
- [ ] 최근 **20개 데이터** 시간순 표시  

---

## 6. 배포 및 운영

### 6.1 로컬 개발
```bash
npm run dev
````

### 6.2 배포

```bash
npm run build
firebase deploy
```

---

## 7. 확장 계획 (MVP 이후)

* 알림/경고 시스템 강화 (이메일, SMS)
* 관리자 페이지 (`/admin`) 추가
* Firebase Analytics 연동
* 다양한 센서 타입 지원
* 데이터 내보내기 및 리포트 기능

---

**문서 버전**: v1.1 (MVP 축소판)
**작성일**: 2025-09-17

```

---
