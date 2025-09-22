# [Deployment] Firebase Hosting 배포 및 운영 환경 구축 - Phase 3 (Issue #5) 해결 계획서

**작성일**: 2025-09-22
**이슈번호**: #5
**브랜치**: aj-mc-issue-5
**담당자**: 개발팀
**리뷰**: ChatGPT 피드백 반영 완료 ✅

---

## 📋 이슈 분석 요약

### 이슈 정보
- **제목**: [Deployment] Firebase Hosting 배포 및 운영 환경 구축 - Phase 3
- **상태**: OPEN
- **생성일**: 2025-09-22T03:31:52Z
- **문제 유형**: Feature/Deployment
- **우선순위**: High
- **복잡도**: Medium

### 핵심 요구사항
1. **Firebase Hosting 배포**: 엔터프라이즈급 모니터링 시스템을 운영 환경에 배포
2. **실시간 데이터 연동**: 배포 환경에서 센서 데이터 실시간 업데이트 정상 작동
3. **환경 분리 시스템**: production/development/staging 환경별 데이터 경로 분리
4. **CI/CD 파이프라인**: GitHub Actions를 통한 자동 배포 시스템 구축
5. **성능 기준 달성**: 로딩 속도 3초 이내, Lighthouse 종합 점수 ≥ 90 (Performance, Accessibility, Best Practices)
6. **보안 및 운영**: Firebase Security Rules 적용, 백업/복구 시스템, 장애 알림 체계

### 기술적 제약사항
- 기존 Firebase 데이터 구조 유지 (변경 불필요)
- 모바일 반응형 지원 유지
- 번들 크기 최적화 (초기 JS 번들 < 500KB)
- SSL/HTTPS 자동 적용

---

## 🔍 현재 상태 분석

### ✅ 완료된 항목
- **완성된 시스템**: Phase 14F까지 완료된 엔터프라이즈급 모니터링 시스템
- **로컬 환경**: 개발 서버 정상 동작 중
- **Firebase 연결**: 기존 `ultrasonic-monitoring-mvp` 프로젝트 연동 상태

### ❌ 미완료 항목
- **Firebase CLI**: 설치되지 않음 (`which firebase` 실행 실패)
- **빌드 테스트**: `vite` 명령어 실행 오류 (node_modules 누락)
- **Firebase 프로젝트**: hosting 초기화되지 않음 (firebase.json 없음)
- **CI/CD**: GitHub Actions 워크플로우 파일 없음
- **환경 분리**: 코드 레벨 환경 분리 로직 미구현
- **보안 설정**: Firebase Security Rules 미적용
- **비밀키 관리**: GitHub Secrets 미설정
- **백업 시스템**: 데이터베이스 백업/복구 절차 없음

### 영향 범위
- **Frontend**: React 19 + Vite 애플리케이션 전체
- **Backend**: Firebase Realtime Database (기존 연결 유지)
- **Database**: 기존 구조 유지, 환경별 경로 분리만 추가
- **Infrastructure**: Firebase Hosting + GitHub Actions

---

## 🎯 해결 전략

### 선택된 접근법: 단계적 배포 (Incremental Deployment)

**선택 이유**:
- 엔터프라이즈급 시스템의 안전한 배포 필요
- 환경 분리 시스템 구현으로 향후 지속적 개발 지원
- 완성된 시스템의 품질 보장 및 롤백 용이성

**대안 분석**:
1. **즉시 배포**: 빠르나 위험도 높음
2. **하이브리드**: 복잡한 설정 관리 필요
3. **단계적 배포**: 안전성과 품질 보장 (선택됨)

---

## 📅 상세 구현 계획

### Phase 1: 준비 및 설정 (Day 1)
**목표**: 배포 환경 구축 및 빌드 테스트 완료

| Task | Description | DoD | Risk |
|------|-------------|-----|------|
| 개발 환경 복구 | npm install 실행하여 node_modules 복구 | `npm run dev` 정상 동작 | Low |
| Firebase CLI 설치 | Firebase CLI 설치 및 로그인 | `firebase --version` 정상 출력 | Low |
| 프로덕션 빌드 테스트 | `npm run build` 성공 및 dist 폴더 생성 확인 | 빌드 에러 없이 완료 | Medium |
| 환경 분리 코드 구현 | firebase.js에 환경별 경로 분리 로직 추가 | 환경별 데이터 경로 분리 동작 | Medium |
| Firebase Security Rules 설정 | database.rules.json 파일 생성 및 적용 | 보안 규칙 적용 완료 | Medium |
| GitHub Secrets 설정 | Firebase 서비스 계정 키 생성 및 등록 | CI/CD 비밀키 준비 완료 | Low |

**핵심 구현 코드 - 환경 분리 (src/services/firebase.js 수정)**:
```javascript
// 환경별 데이터 경로 분리 함수 추가
const getEnvironmentPath = () => {
  const env = import.meta.env.VITE_ENVIRONMENT || 'production'
  return env === 'production' ? '' : `${env}/`
}

// 센서 참조 함수 업데이트
export const getSensorRef = (siteId, sensorKey) => {
  const envPath = getEnvironmentPath()
  return ref(database, `${envPath}sensors/${siteId}/${sensorKey}`)
}

// 사이트 참조 함수 업데이트
export const getSiteRef = (siteId) => {
  const envPath = getEnvironmentPath()
  return ref(database, `${envPath}sites/${siteId}`)
}

// 사이트 목록 참조 함수 추가
export const getSitesRef = () => {
  const envPath = getEnvironmentPath()
  return ref(database, `${envPath}sites`)
}

// 센서 목록 참조 함수 추가
export const getSensorsRef = (siteId) => {
  const envPath = getEnvironmentPath()
  return ref(database, `${envPath}sensors/${siteId}`)
}
```

### Phase 2: Firebase 배포 실행 (Day 2)
**목표**: 운영 환경 배포 및 기능 검증 완료

| Task | Description | DoD | Risk |
|------|-------------|-----|------|
| Firebase 프로젝트 초기화 | firebase init hosting 실행 | firebase.json 파일 생성 | Low |
| 첫 배포 실행 | firebase deploy 실행 | HTTPS URL로 접속 가능 | Medium |
| 전체 기능 검증 | 모든 페이지 및 기능 테스트 | 모든 기능 정상 동작 확인 | High |
| 성능 최적화 | Lighthouse 종합 점수 측정 및 최적화 | Performance, Accessibility, Best Practices ≥ 90 달성 | Medium |
| Firebase Security Rules 배포 | 보안 규칙 배포 및 테스트 | 읽기/쓰기 권한 정상 동작 | High |
| 백업 시스템 설정 | 데이터베이스 백업 스케줄 설정 | 일일 자동 백업 동작 | Medium |

**검증 체크리스트**:
- [ ] https://ultrasonic-monitoring-mvp.web.app 접속 가능
- [ ] 메인 대시보드 (/) 정상 로딩 및 사이트 카드 표시
- [ ] 개별 사이트 모니터링 (/site/:id) 차트 및 데이터 표시
- [ ] 관리자 대시보드 (/admin) 사이트 관리 기능
- [ ] 실시간 센서 데이터 업데이트 확인
- [ ] 알림 시스템 정상 작동
- [ ] 센서 시뮬레이션 기능 테스트
- [ ] 모바일 반응형 디자인 확인
- [ ] Firebase Security Rules 적용 확인
- [ ] 저속 네트워크(3G) 환경 테스트
- [ ] 저사양 기기 호환성 테스트

### Phase 3: 자동화 및 모니터링 (Day 3)
**목표**: CI/CD 구축 및 운영 환경 완성

| Task | Description | DoD | Risk |
|------|-------------|-----|------|
| GitHub Actions 설정 | CI/CD 워크플로우 파일 생성 | 자동 배포 파이프라인 동작 | Medium |
| 배포 스크립트 작성 | package.json에 deploy 명령어 추가 | `npm run deploy` 명령어 동작 | Low |
| 모니터링 설정 | Firebase Analytics 및 Performance 설정 | 모니터링 대시보드 확인 | Low |
| 장애 알림 설정 | 운영 이슈 알림 채널 구축 (Slack/Email) | 장애 발생 시 즉시 알림 | Medium |
| 데이터베이스 백업 스케줄 | 일일 자동 백업 시스템 구축 | 백업 파일 정상 생성 | High |
| 문서 업데이트 | 배포 관련 문서 업데이트 | CLAUDE.md 업데이트 완료 | Low |

**GitHub Actions 워크플로우 (.github/workflows/deploy.yml)**:
```yaml
name: Deploy to Firebase Hosting
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: ultrasonic-monitoring-mvp
          channelId: live
```

---

## ⚠️ 위험도 분석 및 대응 방안

### High Risk Items
| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|-------------------|
| 빌드 실패 | High | Medium | npm install로 의존성 복구, 빌드 과정 단계별 검증 |
| 실시간 데이터 연결 실패 | High | Low | 환경변수 검증, Firebase 연결 테스트 먼저 실행 |
| 성능 기준 미달성 | Medium | Medium | 번들 분석, 코드 스플리팅, 이미지 최적화 |

### Technical Challenges
1. **Vite 빌드 환경변수 처리** - `.env.production` 파일로 환경별 설정 분리
2. **Firebase Security Rules 설정** - 센서 데이터 읽기 허용, 인증된 사용자만 쓰기 허용
3. **번들 크기 최적화** - React 19 + Recharts 라이브러리로 인한 번들 크기 관리
4. **CI/CD 비밀키 관리** - Firebase 서비스 계정 키 안전한 관리
5. **백업 및 복구 전략** - Realtime Database 데이터 백업/복구 자동화

### Rollback Plan
- **배포 실패** → `firebase hosting:rollback` 실행
- **기능 오작동** → 로컬 환경으로 즉시 복구, 문제 해결 후 재배포
- **데이터베이스 이슈** → 일일 백업에서 복구 (`firebase database:get / > backup.json`)
- **보안 규칙 문제** → 이전 버전 규칙 롤백 (`firebase deploy --only database`)
- **성능 저하** → 이전 버전으로 즉시 롤백, 번들 분석 후 최적화

---

## 🧪 품질 보증 계획

### Test Cases
```gherkin
Feature: Firebase Hosting 배포된 모니터링 시스템

Scenario: 메인 대시보드 접속
  Given 사용자가 https://ultrasonic-monitoring-mvp.web.app에 접속
  When 페이지가 로딩
  Then 모든 사이트 카드가 정상 표시되고 실시간 데이터가 업데이트

Scenario: 개별 사이트 모니터링
  Given 사용자가 특정 사이트를 클릭
  When 사이트 상세 페이지로 이동
  Then 차트와 측정 기록이 정상 표시

Scenario: 관리자 기능
  Given 사용자가 /admin 페이지에 접속
  When 사이트 생성/수정/삭제 작업 수행
  Then 모든 CRUD 기능이 정상 동작

Scenario: 실시간 데이터 업데이트
  Given 사용자가 모니터링 페이지에서 대기
  When Firebase 데이터베이스의 센서 값이 변경
  Then 1초 이내 화면에 새로운 값이 반영

Scenario: 성능 검증
  Given Lighthouse 성능 측정 실행
  When 모든 페이지에 대해 측정
  Then Performance 점수 90 이상 달성
```

### Performance Criteria
**기본 성능 기준**:
- **응답시간**: 초기 로딩 3초 이내 (모바일 4G 기준), 5초 이내 (3G 기준)
- **처리량**: 실시간 데이터 업데이트 지연시간 ≤ 1초
- **번들 크기**: 초기 JS 번들 < 500KB

**Lighthouse 종합 점수 기준**:
- **Performance**: ≥ 90 (속도 및 사용자 경험)
- **Accessibility**: ≥ 90 (접근성 및 사용성)
- **Best Practices**: ≥ 90 (보안 및 코드 품질)
- **SEO**: ≥ 80 (검색 엔진 최적화)

**다양한 환경 테스트**:
- **저속 네트워크**: 3G 환경에서 5초 이내 로딩
- **저사양 기기**: 2GB RAM 안드로이드 기기 호환성
- **다양한 브라우저**: Chrome, Safari, Firefox, Edge 호환성

---

## 📦 리소스 요구사항

### Human Resources
- **개발자**: 1명 (Firebase 배포 경험)
- **리뷰어**: 1명 (시스템 검증)
- **QA**: 테스트 담당자 (기능 검증)

### Technical Resources
- **개발 도구**: Firebase CLI, Node.js 20+, npm
- **테스트 환경**: Firebase Hosting 스테이징
- **모니터링**: Firebase Analytics, Performance Monitoring

### Time Estimation
- **총 예상 시간**: 3일
- **버퍼 시간**: 1일 (예상 시간의 30%)
- **완료 목표일**: 2025-09-25

---

## 🚀 즉시 실행 가능한 명령어

### Step 1: 개발 환경 복구
```bash
npm install
```

### Step 2: Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### Step 3: 프로덕션 빌드 테스트
```bash
npm run build
```

### Step 4: Firebase 프로젝트 초기화
```bash
firebase login
firebase init hosting
```

### Step 5: 즉시 배포
```bash
firebase deploy
```

### 배포 후 검증 URL
- **운영 환경**: https://ultrasonic-monitoring-mvp.web.app
- **Firebase Console**: https://console.firebase.google.com/project/ultrasonic-monitoring-mvp

---

## 📝 커뮤니케이션 계획

### Status Updates
- **일일 진행상황**: GitHub 이슈 댓글로 업데이트
- **주요 마일스톤**: 각 Phase 완료 시 상세 보고
- **실시간 소통**: 개발 과정 중 문제 발생 시 즉시 공유

### Stakeholder Notification
- **프로젝트 매니저**: Phase별 완료 시점 보고
- **사용자**: 배포 완료 및 접속 URL 안내
- **개발팀**: 환경 분리 시스템 구현 내용 공유

---

## 🔒 보안 및 운영 설정

### Firebase Security Rules (database.rules.json)
```json
{
  "rules": {
    "sensors": {
      ".read": true,
      ".write": "auth != null"
    },
    "sites": {
      ".read": true,
      ".write": "auth != null"
    },
    "development": {
      ".read": true,
      ".write": true
    },
    "staging": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

### GitHub Secrets 설정
1. **Firebase 서비스 계정 키 생성**:
   ```bash
   # Firebase Console → Project Settings → Service Accounts
   # → Generate new private key → Download JSON
   ```

2. **GitHub Repository Secrets 등록**:
   - `FIREBASE_SERVICE_ACCOUNT`: 서비스 계정 JSON 키 전체 내용
   - `FIREBASE_PROJECT_ID`: `ultrasonic-monitoring-mvp`

### 백업 및 복구 시스템
```bash
# 일일 자동 백업 스크립트 (GitHub Actions)
# .github/workflows/backup.yml
name: Daily Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 매일 오전 2시
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Realtime Database
        run: |
          firebase database:get / > backup-$(date +%Y%m%d).json
          # Google Cloud Storage에 업로드
```

### 장애 알림 시스템
- **Firebase Performance Monitoring**: 성능 저하 감지
- **Firebase Crashlytics**: 오류 발생 즉시 알림
- **Custom Monitoring**: 센서 데이터 업데이트 중단 감지
- **알림 채널**: Slack, Email (24시간 모니터링)

---

## 📋 완료 검증 체크리스트

### Phase 1 완료 기준
- [ ] `npm install` 성공적 실행
- [ ] `firebase --version` 정상 출력
- [ ] `npm run build` 에러 없이 완료
- [ ] 환경 분리 코드 구현 완료

### Phase 2 완료 기준
- [ ] `firebase.json` 파일 생성
- [ ] Firebase Hosting 배포 성공
- [ ] 모든 페이지 정상 접속 확인
- [ ] Lighthouse 종합 점수 달성 (Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90)
- [ ] Firebase Security Rules 적용 완료
- [ ] GitHub Secrets 설정 완료

### Phase 3 완료 기준
- [ ] GitHub Actions 워크플로우 동작
- [ ] `npm run deploy` 명령어 구현
- [ ] Firebase Analytics 설정 완료
- [ ] 백업 시스템 구축 완료
- [ ] 장애 알림 채널 설정 완료
- [ ] 문서 업데이트 완료

### 최종 완료 기준
- [ ] Firebase Hosting에 정상 배포되어 HTTPS URL로 접속 가능
- [ ] 실시간 센서 데이터 연동이 배포 환경에서 정상 작동
- [ ] 모든 기능(대시보드, 사이트 관리, 알림, 시뮬레이션)이 운영 환경에서 정상 동작
- [ ] 환경별 데이터 분리 시스템 구현 완료
- [ ] GitHub Actions CI/CD 파이프라인 구축 완료
- [ ] 성능 기준 달성 (로딩 속도 3초 이내, Lighthouse 종합 점수 ≥ 90)
- [ ] 보안 설정 완료 (Firebase Security Rules 적용)
- [ ] 백업 및 모니터링 시스템 운영 시작
- [ ] 다양한 환경에서 호환성 검증 완료 (3G 네트워크, 저사양 기기)

---

## 🔄 Next Steps

1. **계획 승인**: 이 문서 검토 및 승인
2. **Issue 업데이트**: GitHub 이슈에 계획 링크 추가
3. **개발 시작**: Phase 1부터 순차적 실행
4. **일일 체크인**: 진행상황 일일 업데이트
5. **완료 검증**: 각 Phase별 완료 기준 달성 확인

**💡 참고사항**:
- 모든 작업은 현재 브랜치 `aj-mc-issue-5`에서 진행
- PR 생성 및 병합은 배포 완료 후 수동 진행
- 문제 발생 시 즉시 롤백 계획 실행

---

---

## 📊 ChatGPT 리뷰 반영 사항

### ✅ 보강 완료 항목
1. **보안 강화**:
   - Firebase Security Rules 상세 구현
   - CI/CD 비밀키 관리 절차 추가
   - GitHub Secrets 설정 가이드 포함

2. **백업 및 운영 계획**:
   - 일일 자동 백업 시스템 구축
   - 데이터베이스 백업/복구 절차 상세화
   - 장애 알림 체계 구현 (Slack, Email)

3. **성능 기준 확장**:
   - Lighthouse 종합 점수 (Performance, Accessibility, Best Practices)
   - 다양한 네트워크 환경 테스트 (3G, 4G)
   - 저사양 기기 호환성 검증

4. **운영 안정성**:
   - 롤백 시나리오 확장 (DB, 보안 규칙, 성능)
   - 모니터링 및 알림 시스템 강화
   - 24시간 운영 대응 체계

### 🎯 개선 효과
- **배포 안전성**: 단계별 검증과 롤백 계획으로 위험 최소화
- **운영 안정성**: 자동 백업, 모니터링, 알림으로 지속적 서비스 보장
- **성능 품질**: 다각적 성능 기준으로 사용자 경험 향상
- **보안 강화**: 체계적 보안 규칙과 비밀키 관리로 데이터 보호

**이제 이 계획서는 실무에서 바로 사용 가능한 완전한 배포 및 운영 가이드입니다** ✅

---

**문서 작성**: 2025-09-22
**ChatGPT 리뷰 반영**: 2025-09-22
**최종 검토**: [검토자명]
**승인일**: [승인일]