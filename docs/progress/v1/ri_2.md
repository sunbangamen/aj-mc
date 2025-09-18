
# GitHub Issue Analysis & Solution Planning (Issue #3, v2.1 보강판)

## Step 1: Issue Retrieval & Analysis

### Issue Information Summary
**이슈 번호**: #3  
**제목**: Phase 5: 현장별 상세 모니터링 개발 - 측정 로그 시스템 + 데이터 시각화  
**상태**: OPEN  
**생성일**: 2025-09-18T01:37:13Z  
**담당자**: 없음  
**라벨**: 없음  
**마일스톤**: 없음  

### Issue Content Analysis
**문제 유형**: Feature Enhancement - 데이터 시각화 및 히스토리 시스템  
**우선순위**: High (Phase 5 핵심 기능)  
**복잡도**: Medium  

**핵심 요구사항**:
- 최근 20개 측정 이력 테이블 (시간|거리값|상태)
- Recharts 기반 실시간 라인 차트 구현
- 모바일 반응형 디자인 적용
- Firebase 실시간 데이터 연동 및 자동 업데이트

**기술적 제약사항**:
- Firebase Realtime Database 쿼리 비용 최적화 (`limitToLast(20)`)
- 기존 Phase 1-4 코드베이스와 호환성 유지
- 500ms 이내 실시간 업데이트 성능 요구사항
- 모바일 UX 고려한 반응형 설계 필수

**제외 범위**:
- 데이터 내보내기 (CSV/Excel)
- 알림 시스템
- 커스텀 시간 범위 선택

---

## Step 2: Technical Investigation

### Code Analysis Results
**현재 코드베이스 상태**:
- ✅ Firebase Realtime Database 연동 완료 (`src/services/firebase.js`)
- ✅ 실시간 데이터 훅 (`useSensorData`, `useSiteSensorData`) 구현됨
- ✅ SiteMonitor 페이지 기본 구조 존재 (114-119라인에 히스토리 섹션 placeholder)
- ✅ Recharts 라이브러리 설치됨 (`^3.2.1`)
- ✅ 반응형 CSS 기반 구조 확립

**영향 범위 분석**:
- **Frontend**: `SiteMonitor.jsx` 확장, 새로운 `MeasurementTable.jsx`, `SensorChart.jsx` 추가
- **Backend**: Firebase 데이터 구조 확장 (`/sensors/{site}/history/` 경로)
- **Hooks**: 새로운 `useSensorHistory` 훅 개발
- **Database**: 히스토리 데이터 스키마 설계 및 쿼리 최적화

### Dependency Check
- ✅ Firebase SDK (`^12.2.1`)
- ✅ Recharts (`^3.2.1`)
- ✅ React Router (`^7.9.1`)
- ✅ React (`^19.1.1`)

---

## Step 3: Solution Strategy

### Approach Options
- **Option 1: 점진적 확장** → 안정성 ↑, 속도 ↓  
- **Option 2: 새 컴포넌트 생성 후 통합** → 모듈화, 재사용성, 안정적 (권장)  
- **Option 3: SiteMonitor 전면 리팩토링** → 구조 깔끔, 위험/시간 ↑

### Recommended Approach
**선택**: Option 2 - 새로운 컴포넌트 생성 후 통합  
**이유**:  
- 기존 코드 안정성 유지  
- 컴포넌트 재사용성 및 모바일 반응형 설계 용이  
- 빠른 구현 가능 (Recharts 설치 완료)

---

## Step 4: Detailed Implementation Plan

### Phase 1: 데이터 구조 및 훅 개발 (Day 1)
| Task | Description | DoD | Risk |
|------|-------------|-----|------|
| 히스토리 데이터 훅 개발 | `useSensorHistory(siteId, limit=20)` 구현 | Firebase 실시간 조회 성공 | Low |
| 데이터 구조 설계 | `/sensors/{site}/history/{timestamp}` | 스키마 문서화 및 샘플 데이터 생성 | Low |
| 유틸리티 함수 작성 | 시간 포맷, 상태 변환 | 단위 테스트 통과 | Low |

**데이터 스키마 예시**
```json
{
  "sensors": {
    "site1": {
      "ultrasonic": { /* 현재 데이터 */ },
      "history": {
        "1694962800000": {
          "distance": 150,
          "timestamp": 1694962800000,
          "status": "normal"
        }
      }
    }
  }
}
````

---

### Phase 2: 측정 로그 테이블 (Day 2)

| Task                  | Description           | DoD                 | Risk   |
| --------------------- | --------------------- | ------------------- | ------ |
| MeasurementTable 컴포넌트 | 테이블 UI 생성             | 렌더링 성공              | Low    |
| 실시간 데이터 연동            | `useSensorHistory` 연결 | Firebase 변경 시 즉시 반영 | Medium |
| 모바일 반응형               | CSS Grid/Flexbox 적용   | 768px 이하 스크롤 가능     | Medium |
| 로딩/에러 처리              | 스피너/에러 메시지            | 모든 상태에서 적절한 UI      | Low    |

**테이블 구조**

* 컬럼: 시간 | 거리(cm) | 상태
* 정렬: 최신순
* 제한: 최근 20개 (`limitToLast(20)` 적용 확인)

---

### Phase 3: Recharts 차트 (Day 3)

| Task             | Description     | DoD         | Risk   |
| ---------------- | --------------- | ----------- | ------ |
| SensorChart 컴포넌트 | 기본 LineChart 생성 | 차트 렌더링 성공   | Low    |
| 차트 데이터 연동        | 히스토리 데이터 변환     | 시간별 그래프 표시  | Medium |
| 반응형 스타일링         | 색상/모바일 대응       | 모든 해상도 정상   | Medium |
| 실시간 업데이트         | 새 데이터 애니메이션     | 500ms 이내 반영 | High   |

**차트 설계**

* X축: 시간 (HH\:MM)
* Y축: 거리(cm)
* 상태별 색상 구분 (normal/warning/alert)
* 성능 최적화: `useMemo`, `React.memo`로 데이터 변환/렌더링 최소화

---

### Phase 4: SiteMonitor 통합 (Day 4)

| Task    | Description                      | DoD          | Risk   |
| ------- | -------------------------------- | ------------ | ------ |
| 레이아웃 확장 | 현재값 + 차트 + 테이블 3단 배치             | 레이아웃 완성      | Low    |
| 컴포넌트 통합 | MeasurementTable, SensorChart 삽입 | 페이지 로딩 3초 이내 | Low    |
| UX 최적화  | 테이블 자동 스크롤 + 차트 애니메이션 동기화        | 동기화 정상 동작    | Medium |
| 성능 최적화  | 메모이제이션, 불필요 렌더링 방지               | 렌더링 효율 ↑     | Medium |

---

## Step 5: Risk Assessment & Mitigation

* **Firebase 쿼리 성능** → `limitToLast(20)` + 인덱싱
* **Recharts 업데이트 지연** → useMemo/React.memo 최적화
* **모바일 UX 문제** → CSS Grid 단계별 테스트, fallback 준비
* **통합 충돌** → 컴포넌트 독립 개발 후 단계적 통합

**Rollback Plan**

* 성능 이슈 → 차트 비활성화, 테이블만 유지
* Firebase 구조 문제 → history 기능 제외
* 모바일 호환성 실패 → 데스크톱 우선 배포

---

## Step 6: Resource Requirements

* **개발자**: 1명 (React/Firebase/Recharts 경험자)
* **리뷰어**: 기존 코드 작성자
* **QA**: 개발자 겸임

**시간 추정**

* 총 5-6시간 + 버퍼 1-2시간
* 완료 목표: 개발 착수 후 2일 이내

---

## Step 7: Quality Assurance Plan

### Test Cases

```gherkin
Scenario: 실시간 업데이트
  Given Firebase에 새 데이터 추가
  Then 500ms 이내 테이블+차트 동기화

Scenario: 모바일 반응형
  Given 화면 너비 768px 이하
  Then 차트+테이블 세로 배치

Scenario: 데이터 순서 유지
  Given Firebase 이벤트 지연 발생
  Then 테이블은 최신순 유지

Scenario: 상태별 색상 구분
  Given 다양한 상태 포함 데이터
  Then 차트에서 색상별로 구분 표시
```

### 성능 기준

* 로딩: 3초 이내
* 업데이트 반영: 500ms 이내
* 모바일 반응속도: 200ms 이내 터치 반응
* 메모리 사용: 50MB 이하

---

## Step 8: Communication Plan

* Phase별 완료 시 GitHub 이슈 댓글 업데이트
* 블로커 발생 시 팀 채널 즉시 알림
* PR은 모든 기능 통합 후 단일 제출

---

## 📋 User Review Checklist

* [ ] 요구사항 정확히 반영했는가?
* [ ] Firebase 최적화(`limitToLast(20)`) DoD에 포함됐는가?
* [ ] 차트+테이블 동기화 UX 기준이 추가됐는가?
* [ ] 성능 최적화(useMemo/React.memo) DoD 반영됐는가?
* [ ] 모바일 UX (차트+20개 로그 확인 가능) 기준이 명확한가?
* [ ] 비정상 케이스(Firebase 지연/순서 꼬임) 테스트 추가됐는가?

---

## 🚀 Next Steps

1. Plan 승인
2. GitHub 이슈 업데이트
3. Phase 1부터 개발 착수
4. 각 Phase 완료 시 이슈 댓글 기록
5. 최종 통합 테스트 → PR 제출

---

**업데이트 이력**

* v2.0 (2025-09-18): 초기 작성
* v2.1 (2025-09-18): Firebase 쿼리 DoD 보강, UX 동기화 기준 추가, 성능 최적화 구체화, 모바일 UX 세분화, 비정상 시나리오 테스트 반영

```

