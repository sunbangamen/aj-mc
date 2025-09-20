# 관제 모니터링 개선 세션 기록

본 문서는 본 AI 협업 세션에서 논의/합의/적용된 변경 사항과 향후 과제를 요약합니다. 운영 관점에서 바로 참고할 수 있도록 의사결정과 구현 포인트를 정리했습니다.

## 요약
- 대표 상태(현장별) 계산을 공통화하고, 센서타입별 오프라인 판정시간을 반영하여 “실무형” 표시 정확도 향상
- 하드웨어 관리에 오프라인 판정시간(전역/현장·타입별) 설정 UI 추가 및 간소화
- 시뮬레이션 워치독(지연 감지)과 전역 오류 경계(ErrorBoundary)로 안정성 보강
- 대시보드 UX 개선: 주요 이슈(Top Issues) 박스, 원인 센서 가독성, 카드/통계의 표기 일관성 및 크기 개선
- 로그 통일 및 포맷 고정: Prettier 설정 추가, `utils/log` 기반 로깅 통일

---

## 주요 결정 사항
- 센서 키 표준: 비패딩 `_n` (예: `ultrasonic_1`)으로 통일
  - 시뮬레이션 시작 시 패딩 키(`_01`) 자동 마이그레이션/정리
- 대표 상태 산정: “최악 우선(alert > warning > normal > offline) + 동률은 최신값 우선”
  - 각 센서의 신선도(오프라인 판정)는 타입별 `offline_timeout`으로 수행
  - 전역값 → 현장 오버라이드 순으로 적용
- 테스트 초기화: `ultrasonic_1` 생성 시 하드웨어 메타데이터(배터리/신호/모델 등) 포함
- 메타데이터 보존: 오프라인 전환 시 `update` 사용으로 기존 필드 보존

---

## 구현 포인트
- 대표 상태 공통 유틸: `src/utils/representativeStatus.js`
  - `computeRepresentativeStatus(siteData, thresholds)` → `{ status, timestamp, causeKey, causeType }`
  - UI(카드/통계)에서 동일 로직 사용

- 하드웨어 관리(오프라인 판정시간)
  - 파일: `src/components/HardwareMetadataPanel.jsx`
  - 전역/현장 선택 + 센서타입별 초 단위 입력(10–3600초)
  - 현장 선택 시 해당 현장의 센서타입만 노출(전역은 전체)
  - 단순/컴팩트 UI로 정리

- 대시보드 표시/UX
  - 현장 카드(`SiteCard.jsx`): 상태 배지 옆 “원인: 초음파 1” 가독성 확대(폰트/패딩), 클릭 이동은 카드 전체 링크(현장으로)만 유지
  - 시스템 현황(`SystemStatsCards.jsx`): 값/라벨 폰트 확대, “주요 이슈” 박스 추가(테두리/패딩/배경), 원인 센서 라벨 강조

- 시뮬레이션 안정성
  - 워치독 상태 제공: `SimulationContext` → `watchdog`(healthy/delayed/stopped)
  - 레이아웃 상단에 지연 배너 표시(실행 중 + delayed)
  - 중복 변수 선언 제거로 Vite HMR 오류 해결

- 로깅/포맷
  - `.prettierrc.json` 추가(2sp/singleQuote/semi:false/width:80/trailingComma:es5)
  - 산발적 `console.log` → `utils/log.debug/error`로 통일(프로덕션 침묵, 개발 스위치)

---

## 커밋 스냅샷
- docs: update Firebase data structure to v2 … (`4ca8ecd`)
- refactor: standardize sensor keys to unpadded _n … (`96feec0`)
- feat(hardware): backfill hardware metadata + UI action (`d916ab4`)
- feat(test-setup): add hardware metadata to test init; preserve metadata on offline updates; pass siteId (`1253fef`)
- feat(dashboard): representative status & per-site sensors subscription (`666aa40`)
- feat(dashboard): site cards use representative status (`3165ee8`)
- fix(sim): simplify backfill metadata (remove wrapper) (`68cd761`)
- fix(sim): remove duplicate endTime declaration (`625e9c7`)
- chore(format+logs): add Prettier; unify logs (`d1639e6`)
- feat(monitoring): cause on site cards; extend representative status (`e0ca813`)
- feat(monitoring): cause/cause links & Top Issues list (`1f51e62`)
- fix(monitoring): route cause links to site only (`c2a08ff`)
- feat(ui): enlarge cause labels (`e5d1b1e`)
- feat(ui): System Status readability improvements (`652279a`)
- feat(ui): Top Issues bordered container (`9012935`)
- feat(safety): ErrorBoundary; watchdog banner in Layout (`5f56da5`)

> 정확한 변경 내역은 `git log`를 참고하세요.

---

## 운영 체크리스트
- [ ] 관리자 > 하드웨어 관리에서 현장별 `offline_timeout` 설정 저장 확인
- [ ] 대시보드 카드/시스템 현황/주요 이슈가 설정값 기준으로 오프라인 판정되는지 확인
- [ ] 시뮬레이션 실행/정지, 간격 변경 시 워치독 배너 동작 확인
- [ ] 테스트 초기화(테스트 페이지)로 메타데이터 포함 생성 확인

---

## 향후 권장 과제
- 대규모 최적화: 대시보드용 요약 경로(대표 상태/최근시간/이슈 카운트) 제공 → 루트 구독 부하 감소
- 시뮬레이션 쓰기 배치화/동시성 제한 → 사이클 안정화 및 워치독 지연 감소
- RTDB Rules 최소 권한화 및 문서화
- 유닛 테스트(대표 상태/키 파싱/센서 추출) 도입(Vitest)
- 알림 채널 연동(이메일/SMS/슬랙 등) 로드맵 수립

---

## 데모 팁
- 현장 2–3개(정상/주의/경고) 구성 후 대시보드에서 대표 상태/주요 이슈를 먼저 시연
- 하드웨어 관리에서 `offline_timeout`을 서로 다르게 설정 → 오프라인 판정 시점 차이 시연
- 워치독 지연 유도(간격 일시 증대)로 지연 배너 시연
- `VITE_DEBUG_LOGS=false`로 운영 시 콘솔 노이즈 억제

