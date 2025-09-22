# Firebase 데이터 구조 (v2)

본 문서는 현재 구현(다중 센서, 센서별 히스토리, 임계값/알림 시스템)을 기준으로 한 Realtime Database 구조를 설명합니다.

## 최상위 경로 개요

- `/sites` — 사이트(현장) 메타데이터
- `/sensors` — 사이트별 센서의 현재값과 히스토리(센서별)
- `/alerts` — 활성 알림 및 알림 히스토리
- `/settings/thresholds` — 전역/사이트별 임계값 설정

---

## 1) 사이트 메타데이터 (`/sites`)

경로: `/sites/{siteId}`

예시:

```json
{
  "sites": {
    "site_1700000000000_abcd12": {
      "name": "현장 A",
      "location": "서울시 OO구 OO로",
      "description": "저수조 모니터링",
      "sensorConfig": {
        "ultrasonic": 2,
        "temperature": 1,
        "humidity": 0,
        "pressure": 0
      },
      "status": "active", // active|inactive|maintenance
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000
    }
  }
}
```

비고:
- `sensorConfig`는 센서 타입별 설치 개수입니다.
- `status`는 운영 상태입니다(`active`, `inactive`, `maintenance`).

---

## 2) 센서 데이터 (`/sensors`)

경로: `/sensors/{siteId}/{sensorKey}`

센서 키 규칙:
- 표준(운영): `{sensorType}_{n}` (비패딩) 예: `ultrasonic_1`, `temperature_1`
- 레거시 호환: `{sensorType}` 또는 `{sensorType}_{NN}`(패딩)도 읽기 지원. 신규 데이터는 비패딩을 권장합니다.

센서 데이터 공통 필드:
- `timestamp` (ms), `lastUpdate` (ms), `status` (`normal|warning|alert|offline`)
- 타입별 값
  - 초음파: `distance` (cm)
  - 온도: `temperature` (°C) 및 `value` 미러링
  - 습도: `humidity` (%) 및 `value` 미러링
  - 압력: `pressure` (hPa) 및 `value` 미러링
- 선택 메타데이터(하드웨어/운영): `deviceId`, `location`, `batteryLevel`, `signalStrength`, `firmwareVersion`, `hardwareModel`, `installDate`, `lastMaintenance`, `calibrationDate`, `accuracy`, `reliability`, `errorCount`, `consecutiveErrors` 등

예시(다중 센서, 비패딩 키):

```
/sensors/
└── site_1700000000000_abcd12/
    ├── ultrasonic_1/
    │   ├── distance: 145.2
    │   ├── status: "normal"
    │   ├── timestamp: 1700001000000
    │   ├── lastUpdate: 1700001000000
    │   ├── deviceId: "SIM_AB12_ULS_1"
    │   ├── batteryLevel: 92
    │   ├── signalStrength: -48
    │   └── history/
    │       ├── 1700000970000: { distance: 150.1, status: "normal", timestamp: 1700000970000, ... }
    │       └── 1700001000000: { distance: 145.2, status: "normal", timestamp: 1700001000000, ... }
    └── temperature_1/
        ├── temperature: 24.3
        ├── value: 24.3
        ├── status: "normal"
        ├── timestamp: 1700001000000
        └── history/
            └── 1700001000000: { temperature: 24.3, value: 24.3, status: "normal", ... }
```

히스토리 키: 타임스탬프(ms)를 문자열 키로 사용합니다. 각 항목은 당시의 센서 스냅샷입니다.

---

## 3) 알림 구조 (`/alerts`)

경고는 임계값 및 상태에 따라 생성되며 활성/히스토리로 분리 저장됩니다.

경로:
- 활성 알림: `/alerts/active/{alertId}`
- 알림 히스토리: `/alerts/history/{pushId}`

예시(활성):

```json
{
  "alerts": {
    "active": {
      "site_..._ultrasonic_1_alert_1700001000123_xxx": {
        "id": "site_..._ultrasonic_1_alert_1700001000123_xxx",
        "type": "alert",            // warning|alert|critical|offline|...
        "priority": 2,               // 낮을수록 중요
        "siteId": "site_1700000000000_abcd12",
        "sensorKey": "ultrasonic_1",
        "message": "🚨 경고: ultrasonic 센서 임계값 초과 (210)",
        "timestamp": 1700001000123,
        "data": { "value": 210, "unit": "cm" },
        "acknowledged": false
      }
    },
    "history": {
      "-NvXy...": { /* 위와 동일 구조의 과거 알림 */ }
    }
  }
}
```

비고:
- 활성 알림은 `id`를 키로 저장됩니다. 히스토리는 `push()` 키로 누적됩니다.
- 자동/수동 정리 로직으로 오래된 히스토리를 정기 삭제할 수 있습니다.

---

## 4) 임계값 설정 (`/settings/thresholds`)

경로:
- 전역 기본값: `/settings/thresholds/global`
- 사이트별 오버라이드: `/settings/thresholds/sites/{siteId}`

예시(요약):

```json
{
  "settings": {
    "thresholds": {
      "global": {
        "ultrasonic": {
          "warning": { "min": 100, "max": 199 },
          "alert": { "min": 200, "max": 300 },
          "critical": { "min": 350, "max": 500 },
          "offline_timeout": 60000
        },
        "temperature": { /* ... */ }
      },
      "sites": {
        "site_1700000000000_abcd12": {
          "ultrasonic": { "warning": { "min": 120, "max": 199 } }
        }
      }
    }
  }
}
```

상속 규칙:
- 사이트별 설정이 존재하는 센서 타입은 전역값을 덮어씁니다. 그 외 타입은 전역 기본값을 사용합니다.

---

## 상태 판정 및 오프라인 기준

- 상태(`normal|warning|alert|critical`)는 센서 타입별 임계값 범위에 따라 결정됩니다.
- `offline`은 다음 중 하나일 때 판정됩니다.
  - 센서 데이터의 `status`가 `offline`인 경우
  - `lastUpdate`가 `offline_timeout`(센서 타입별 설정)보다 오래된 경우

---

## 마이그레이션/레거시 호환

- 과거 단일 키(`ultrasonic`) 또는 비패딩 키(`ultrasonic_1`)가 존재할 수 있습니다. 클라이언트는 중복/혼재된 키를 정규화해 표시합니다.
- 신규 데이터 생성 시에는 2자리 패딩 키(`{type}_{NN}`) 사용을 권장합니다.
