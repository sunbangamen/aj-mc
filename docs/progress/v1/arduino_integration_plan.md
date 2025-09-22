# 아두이노 D1 보드 Firebase 연동 계획서

**문서 버전**: v1.0
**작성일**: 2025-09-18
**대상 Phase**: Phase 14 - 하드웨어 연동
**우선순위**: 실제 센서 연동 필요 시

---

## 📋 개요

### 목적
- 아두이노 D1(ESP8266) 보드를 통한 실제 센서 데이터 수집
- Firebase Realtime Database에 실시간 센서 데이터 전송
- 현장별/센서별 다중 센서 지원 시스템 구축

### 현재 상황
- ✅ **웹 애플리케이션**: Phase 1-9 완료 (시뮬레이션 기반)
- ✅ **Firebase 구조**: 기본 센서 데이터 구조 확립
- 🚧 **하드웨어 연동**: 미구현 (현재 시뮬레이션으로 대체)

---

## 🎯 핵심 요구사항

### 1. 다중 센서 지원
- **현장당 여러 개의 동일 센서** (예: 초음파 센서 3개)
- **현장당 다양한 센서 타입** (예: 초음파 + 온도 + 습도)
- **센서별 위치 정보** 관리 (동쪽벽, 서쪽벽, 천장 등)

### 2. 하드웨어 식별
- **디바이스 ID**: 실제 하드웨어 구분 (MAC 주소 기반)
- **센서 번호**: 논리적 센서 구분 (ultrasonic_01, ultrasonic_02)
- **위치 정보**: 센서 설치 위치 (사용자 친화적 이름)

### 3. 데이터 일관성
- **웹앱-하드웨어 호환성**: 기존 시뮬레이션과 실제 데이터 혼용 지원
- **실시간 동기화**: 센서 데이터 즉시 웹앱 반영
- **오프라인 처리**: 네트워크 장애 시 데이터 버퍼링

---

## 🏗️ 데이터 구조 설계

### 현재 구조 (Phase 1-9)
```json
{
  "sensors": {
    "site_1234567890_abc123": {
      "ultrasonic": {
        "distance": 120,
        "status": "normal",
        "timestamp": 1726574400000
      }
    }
  }
}
```

### 제안하는 새 구조 (Phase 14 + 확장)
```json
{
  "sensors": {
    "site_강남현장": {
      "ultrasonic_01": {
        "distance": 120,
        "status": "normal",
        "timestamp": 1726574400000,
        "lastUpdate": 1726574400000,
        "deviceId": "ESP8266_5C:CF:7F:12:34:56",
        "location": "동쪽벽",

        // Phase 14D: 하드웨어 메타데이터
        "batteryLevel": 85,
        "signalStrength": -45,
        "firmwareVersion": "v1.2.3",
        "hardwareModel": "HC-SR04",

        // Phase 14D: 유지보수 정보
        "installDate": 1726574400000,
        "lastMaintenance": 1726574400000,
        "calibrationDate": 1726574400000,
        "warrantyExpire": 1790000000000,

        // Phase 14D: 측정 품질 지표
        "accuracy": 95.5,
        "reliability": "high",
        "errorCount": 0,
        "consecutiveErrors": 0,

        "history": {
          "1726574400001": {...},
          "1726574403001": {...}
        }
      }
    }
  },

  // Phase 14E: 알림 시스템
  "alerts": {
    "thresholds": {
      "site_강남현장": {
        "ultrasonic_01": {
          "warning": 150,
          "alert": 200,
          "critical": 250
        },
        "global": {
          "offline": 300000
        }
      }
    },
    "notifications": {
      "settings": {
        "email": ["admin@company.com"],
        "sms": ["+82-10-1234-5678"],
        "webhooks": ["https://api.company.com/alerts"]
      },
      "history": {
        "1726574400000": {
          "type": "warning",
          "sensor": "ultrasonic_01",
          "site": "site_강남현장",
          "message": "Distance threshold exceeded: 160cm",
          "acknowledged": false
        }
      }
    }
  },

  // Phase 14F: 사용자 관리
  "users": {
    "userId123": {
      "profile": {
        "name": "홍길동",
        "email": "hong@company.com",
        "role": "admin",
        "department": "시설관리팀"
      },
      "permissions": {
        "sites": ["site_강남현장", "site_서초현장"],
        "actions": ["read", "write", "admin"]
      },
      "preferences": {
        "theme": "dark",
        "language": "ko",
        "notifications": true
      }
    }
  },

  // Phase 14G: 시스템 로그
  "systemLogs": {
    "2025-09-18": {
      "actions": [
        {
          "timestamp": 1726574400000,
          "user": "userId123",
          "action": "sensor_threshold_updated",
          "details": "Updated warning threshold for ultrasonic_01"
        }
      ],
      "errors": [
        {
          "timestamp": 1726574400000,
          "error": "connection_timeout",
          "sensor": "ultrasonic_02",
          "retries": 3
        }
      ],
      "performance": {
        "avgResponseTime": 150,
        "uptime": 99.8,
        "totalRequests": 8640
      }
    }
  }
}
```

---

## 📐 구현 계획

### Phase 14A: 데이터 구조 확장 (웹앱 수정)
**예상 소요시간**: 2-3시간

| Task | Description | DoD | Risk |
|------|-------------|-----|------|
| Firebase 스키마 확장 | 다중 센서 지원 구조로 변경 | 기존 데이터와 호환성 유지 | Medium |
| 웹앱 UI 수정 | 센서별 개별 표시 지원 | 현장당 여러 센서 목록 표시 | Low |
| 센서 위치 관리 | 관리자 페이지에 위치 설정 추가 | CRUD 작업으로 센서 위치 관리 | Low |

### Phase 14B: 아두이노 코드 템플릿 (하드웨어 측)
**예상 소요시간**: 3-4시간

| Task | Description | DoD | Risk |
|------|-------------|-----|------|
| WiFi + Firebase 연결 | ESP8266 기본 연결 코드 | Firebase에 데이터 전송 성공 | Medium |
| 센서 데이터 수집 | 초음파/온도/습도 센서 통합 | JSON 형태 데이터 생성 | Low |
| 에러 핸들링 | 네트워크 장애 시 재시도 로직 | 오프라인 상황 대응 | High |

### Phase 14C: 센서 등록 시스템 (관리 기능)
**예상 소요시간**: 2-3시간

| Task | Description | DoD | Risk |
|------|-------------|-----|------|
| 센서 등록 UI | 새 센서 등록/관리 인터페이스 | 센서 추가/제거/수정 가능 | Low |
| 디바이스 상태 모니터링 | 배터리, 신호강도 표시 | 하드웨어 상태 실시간 확인 | Medium |
| 자동 발견 | 새 센서 자동 감지 및 등록 | 플러그 앤 플레이 방식 | High |

### Phase 14D: 운영 메타데이터 확장 (NEW)
**예상 소요시간**: 2-3시간

| Task | Description | DoD | Risk |
|------|-------------|-----|------|
| 하드웨어 메타데이터 | 배터리, 신호강도, 펌웨어 버전 추가 | 센서 상태 세부 정보 표시 | Low |
| 유지보수 정보 | 설치일, 교정일, 점검일 관리 | 유지보수 스케줄 자동 알림 | Medium |
| 측정 품질 지표 | 정확도, 신뢰도, 오류 횟수 추적 | 센서 성능 모니터링 | Medium |

### Phase 14E: 알림 및 임계값 시스템 (NEW)
**예상 소요시간**: 3-4시간

| Task | Description | DoD | Risk |
|------|-------------|-----|------|
| 임계값 설정 | 센서별 warning/alert/critical 임계값 | 관리자 페이지에서 임계값 설정 | Low |
| 실시간 알림 | 임계값 초과 시 즉시 알림 | 웹, 이메일, SMS 알림 지원 | Medium |
| 알림 이력 관리 | 알림 발생 이력 저장 및 조회 | 알림 통계 및 트렌드 분석 | Low |

### Phase 14F: 사용자 권한 관리 (NEW)
**예상 소요시간**: 4-5시간

| Task | Description | DoD | Risk |
|------|-------------|-----|------|
| 사용자 인증 | 로그인/로그아웃 시스템 | Firebase Auth 또는 커스텀 인증 | Medium |
| 권한 체계 | 관리자/운영자/조회자 역할 구분 | 역할별 접근 권한 제어 | High |
| 사이트별 권한 | 사용자별 접근 가능한 사이트 제한 | 다중 현장 관리 시 보안 강화 | Medium |

### Phase 14G: 고급 분석 및 리포팅 (NEW)
**예상 소요시간**: 3-4시간

| Task | Description | DoD | Risk |
|------|-------------|-----|------|
| 데이터 내보내기 | CSV, Excel 형태 데이터 다운로드 | 기간별, 센서별 데이터 추출 | Low |
| 통계 대시보드 | 일/주/월 통계 및 트렌드 분석 | 평균, 최대, 최소값 차트 | Medium |
| 성능 리포트 | 센서별 가동률, 오류율 리포트 | 유지보수 계획 수립 지원 | Medium |

---

## 🔧 아두이노 코드 구조 (예시)

### ESP8266 기본 코드 템플릿
```cpp
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <ArduinoJson.h>

// 설정값 (각 센서마다 다르게 설정)
#define SITE_ID "site_강남현장"
#define SENSOR_TYPE "ultrasonic"
#define SENSOR_NUM "01"
#define WIFI_SSID "your-wifi"
#define WIFI_PASSWORD "your-password"

FirebaseData firebaseData;
String deviceId;
String sensorPath;

void setup() {
  Serial.begin(115200);

  // 디바이스 ID 생성 (MAC 주소 기반)
  deviceId = "ESP8266_" + WiFi.macAddress();
  sensorPath = "/sensors/" + String(SITE_ID) + "/" + String(SENSOR_TYPE) + "_" + String(SENSOR_NUM) + "/";

  // WiFi 연결
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("WiFi 연결 중...");
  }

  // Firebase 초기화
  Firebase.begin("your-database-url", "your-auth-token");
  Firebase.reconnectWiFi(true);
}

void loop() {
  // 센서 데이터 수집
  int distance = readUltrasonicSensor();
  String status = determineStatus(distance);

  // JSON 데이터 생성
  DynamicJsonDocument doc(1024);
  doc["distance"] = distance;
  doc["status"] = status;
  doc["timestamp"] = millis();
  doc["deviceId"] = deviceId;
  doc["location"] = "동쪽벽";  // 설정값
  doc["batteryLevel"] = getBatteryLevel();
  doc["signalStrength"] = WiFi.RSSI();

  String jsonString;
  serializeJson(doc, jsonString);

  // Firebase에 전송
  if (Firebase.setString(firebaseData, sensorPath, jsonString)) {
    Serial.println("데이터 전송 성공: " + jsonString);
  } else {
    Serial.println("전송 실패: " + firebaseData.errorReason());
  }

  delay(3000);  // 3초마다 전송
}
```

---

## 🚨 기술적 고려사항

### 1. 호환성 문제
**현재 이슈**: 기존 시뮬레이션은 `"ultrasonic"` 키 사용, 새 구조는 `"ultrasonic_01"` 사용
**해결방안**:
```javascript
// 웹앱에서 두 구조 모두 지원
const sensorData = site.ultrasonic || site.ultrasonic_01 || {};
```

### 2. 네트워크 안정성
**현재 이슈**: WiFi 불안정, Firebase 연결 끊김
**해결방안**:
- 자동 재연결 로직
- 로컬 데이터 버퍼링
- 배치 전송 (여러 데이터 한 번에)

### 3. 전력 관리
**현재 이슈**: 배터리 기반 센서의 전력 소모
**해결방안**:
- Deep Sleep 모드 활용
- 전송 주기 조절 (배터리 잔량에 따라)
- 저전력 센서 선택

---

## 📋 테스트 계획

### 1. 단위 테스트
- [ ] ESP8266 WiFi 연결 테스트
- [ ] Firebase 데이터 전송 테스트
- [ ] 센서 데이터 수집 테스트

### 2. 통합 테스트
- [ ] 웹앱에서 실시간 데이터 수신 확인
- [ ] 다중 센서 동시 작동 테스트
- [ ] 네트워크 장애 시 복구 테스트

### 3. 현장 테스트
- [ ] 실제 환경에서 24시간 연속 작동
- [ ] 다양한 거리값에서 정확도 검증
- [ ] 배터리 수명 측정

---

## 🎯 우선순위 및 진행 방향

### ✅ 완료됨
**Phase 14A: 데이터 구조 확장**
- ✅ 현재 웹앱을 다중 센서 지원하도록 수정
- ✅ 기존 시뮬레이션과 호환성 유지
- ✅ 센서별 개별 차트 및 테이블 표시

### 🔥 즉시 시작 가능 (추천)
**Phase 14D: 운영 메타데이터 확장**
- 배터리, 신호강도 등 하드웨어 상태 정보 추가
- 유지보수 스케줄 및 센서 성능 지표 관리
- **우선순위**: 높음 (실운영 필수)

**Phase 14E: 알림 및 임계값 시스템**
- 센서별 임계값 설정 및 실시간 알림
- 이메일/SMS 알림 시스템 구축
- **우선순위**: 높음 (안전 관리 필수)

### 📱 소프트웨어 확장
**Phase 14F: 사용자 권한 관리**
- 다중 사용자 지원 및 역할 기반 접근 제어
- 사이트별 권한 관리
- **우선순위**: 중간 (다중 현장 운영 시 필요)

**Phase 14G: 고급 분석 및 리포팅**
- 데이터 내보내기 및 통계 대시보드
- 성능 분석 및 트렌드 리포트
- **우선순위**: 낮음 (운영 최적화용)

### 🔧 하드웨어 연동 (준비되면)
**Phase 14B: 아두이노 코드 개발**
- ESP8266 기본 연결 및 데이터 전송
- 센서별 코드 템플릿 작성
- 에러 핸들링 및 자동 재연결

**Phase 14C: 센서 등록 시스템**
- 센서 등록/해제 자동화
- 하드웨어 상태 모니터링
- 대규모 센서 네트워크 관리

---

## 📝 다음 단계

1. **Phase 14A 시작 결정** - 웹앱 다중 센서 지원 구현
2. **하드웨어 사양 확정** - 사용할 센서 모델 및 ESP8266 보드
3. **테스트 환경 구축** - 개발용 센서 및 브레드보드 준비
4. **Firebase 비용 검토** - 실시간 데이터 전송 비용 계산

**예상 총 개발시간**: 18-25시간 (전체 7개 Phase 합계)
- **핵심 기능** (Phase 14D-E): 5-7시간
- **확장 기능** (Phase 14F-G): 7-9시간
- **하드웨어 연동** (Phase 14B-C): 5-7시간

**하드웨어 비용**: 센서당 약 20,000-50,000원 (ESP8266 + 센서)