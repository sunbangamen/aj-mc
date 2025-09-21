# Wemos D1 (ESP8266) + SRF05 초음파 센서 연결 가이드 (Firebase 실운영)

이 문서만 따라 하면 하드웨어가 Firebase RTDB에 즉시 데이터를 올리고, 웹 관제에 바로 반영됩니다.

## 1) 준비물
- Wemos D1 (ESP8266)
- SRF05 초음파 센서 (TRIG / ECHO 분리형)
- 점퍼 케이블, 5V 전원 (보드 USB 전원 사용 가능)
- Arduino IDE (보드 매니저에 ESP8266 설치)
- **라이브러리**: NTPClient (라이브러리 관리자에서 "NTPClient" 검색 후 설치)

## 2) 배선도 (SRF05 ↔ Wemos D1)
- VCC → 5V
- GND → GND
- TRIG → D5 (GPIO14)
- ECHO → D6 (GPIO12)

> 주의: ECHO가 5V로 출력되는 센서의 경우 보드에 따라 레벨시프터가 필요할 수 있습니다. D1은 많은 사례에서 직접 연결로 동작하지만, 하드웨어 사양에 맞춰 안전하게 구성하세요.

## 3) Firebase 설정 (익명 인증 + RTDB URL)
- Firebase 콘솔 → 인증 → 로그인 방법 → 익명 사용 설정: 사용
- RTDB URL 확인: `https://<project-id>-default-rtdb.firebaseio.com/`
- Web API Key 확인: 프로젝트 설정 → 일반 → 웹 API 키
- RTDB 규칙(개발권장): 인증 사용자만 읽기/쓰기
  ```json
  {
    "rules": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
  ```

## 4) 현장(사이트) 등록 방법 (둘 중 하나)
- A. 웹 관리자에서 현장 생성(권장): 관리자 → 사이트 관리(또는 관리자 패널)에서 이름/센서 설정(초음파 1개) → 상태를 활성으로 저장
- B. 1회성 REST 등록(curl):
  ```bash
  SITE_ID="site_wemos1"
  DB_URL="https://<project-id>-default-rtdb.firebaseio.com"
  curl -X PUT "${DB_URL}/sites/${SITE_ID}.json" -d '{
    "name":"Wemos SRF05 데모",
    "location":"현장 A",
    "description":"ESP8266+SRF05",
    "sensorConfig":{"ultrasonic":1,"temperature":0,"humidity":0,"pressure":0},
    "status":"active",
    "createdAt":'$(( $(date +%s%3N) ))',
    "updatedAt":'$(( $(date +%s%3N) ))'
  }'
  ```

## 5) 장비 식별 및 경로 규칙
- 사이트 ID: 예) `site_wemos1` (위에서 생성한 값과 일치)
- 센서 키: 비패딩 `_n` 형식 → `ultrasonic_1`
- 현재값 경로: `/sensors/{siteId}/ultrasonic_1`
- 히스토리 경로: `/sensors/{siteId}/ultrasonic_1/history/{timestamp}`

## 6) Arduino 펌웨어 (HTTPS REST, 익명 인증)
아래 스케치를 그대로 넣고 Wi‑Fi/프로젝트 설정만 바꾸세요. 익명 로그인으로 ID 토큰을 받아 RTDB REST API에 기록합니다.

```cpp
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <WiFiUdp.h>
#include <NTPClient.h>

// ====== 사용자 설정 ======
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

const char* API_KEY   = "YOUR_FIREBASE_WEB_API_KEY";                 // Firebase Web API Key
const char* RTDB_HOST = "<project-id>-default-rtdb.firebaseio.com";  // 예: myproj-default-rtdb.firebaseio.com

const char* SITE_ID   = "site_1758443784_hardware";   // 실제 하드웨어 전용 사이트 ID
const char* SENSORKEY = "ultrasonic_1";     // 센서 키 (비패딩 규칙)

// ====== 핀 설정 (ESP8266 + SRF05) ======
// 기본 배선(권장): TRIG=D5, ECHO=D6
const int TRIG_PIN = D5; // GPIO14
const int ECHO_PIN = D6; // GPIO12

// ====== 주기(밀리초) ======
unsigned long INTERVAL_MS = 3000; // 3초

// ====== NTP 시간 동기화 설정 ======
WiFiUDP ntpUDP;
// 중요: DB에는 항상 UTC epoch(ms)를 저장하세요.
// 로컬 타임존 보정(예: +9h)을 넣으면 웹과의 신선도 비교가 어긋나 오프라인으로 보일 수 있습니다.
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000); // UTC 기준, 1분마다 동기화

// ====== 옵션: 배터리 측정 (기본 OFF) ======
#define USE_BATTERY 0
// ESP8266(일반 보드) ADC는 0~1.0V 범위입니다. 반드시 외부 분압 후 A0로 입력하세요.
// 예: 220kΩ(상단)/100kΩ(하단) → 분압비 약 3.2 → 4.2V도 1.31V라 과전압. 330k/100k(약 4.3) 또는 470k/100k(약 5.7) 등으로 조정 필요.
// 안전하게 4.2V 만충을 1.0V 이하로 맞추세요(예: 680k/150k ≈ 5.53 → 4.2V/5.53=0.76V).
#if USE_BATTERY
const float ADC_REF_V   = 1.00;   // ESP8266 A0 최대 1.00V 근사
const float DIV_RATIO   = 5.53;   // 예: 680k/150k → 약 5.53배 (자신의 분압비에 맞게 수정)
const float BAT_V_MIN   = 3.30;   // Li-ion 하한 근사
const float BAT_V_MAX   = 4.20;   // Li-ion 만충
#endif

// ====== 내부 상태 ======
String idToken = "";
unsigned long lastPost = 0;

// ====== HTTP 유틸 ======
String httpPostJson(WiFiClientSecure& client, const String& host, const String& url, const String& json) {
  if (!client.connect(host, 443)) return "";
  String req = String("POST ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "User-Agent: esp8266/1.0\r\n" +
               "Connection: close\r\n" +
               "Content-Type: application/json\r\n" +
               "Content-Length: " + json.length() + "\r\n\r\n" +
               json;
  client.print(req);
  String line, body; bool headerEnded = false;
  while (client.connected() || client.available()) {
    line = client.readStringUntil('\n');
    if (!headerEnded) { if (line == "\r") headerEnded = true; }
    else { body += line; }
  }
  client.stop();
  return body;
}

String httpPutJson(WiFiClientSecure& client, const String& host, const String& url, const String& json) {
  if (!client.connect(host, 443)) return "";
  String req = String("PUT ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "User-Agent: esp8266/1.0\r\n" +
               "Connection: close\r\n" +
               "Content-Type: application/json\r\n" +
               "Content-Length: " + json.length() + "\r\n\r\n" +
               json;
  client.print(req);
  String line, body; bool headerEnded = false;
  while (client.connected() || client.available()) {
    line = client.readStringUntil('\n');
    if (!headerEnded) { if (line == "\r") headerEnded = true; }
    else { body += line; }
  }
  client.stop();
  return body;
}

// PATCH: 부모 노드를 덮어쓰지 않고 병합 업데이트 (history 보존용)
String httpPatchJson(WiFiClientSecure& client, const String& host, const String& url, const String& json) {
  if (!client.connect(host, 443)) return "";
  String req = String("PATCH ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "User-Agent: esp8266/1.0\r\n" +
               "Connection: close\r\n" +
               "Content-Type: application/json\r\n" +
               "Content-Length: " + json.length() + "\r\n\r\n" +
               json;
  client.print(req);
  String line, body; bool headerEnded = false;
  while (client.connected() || client.available()) {
    line = client.readStringUntil('\n');
    if (!headerEnded) { if (line == "\r") headerEnded = true; }
    else { body += line; }
  }
  client.stop();
  return body;
}

// ====== Firebase 익명 로그인 ======
bool firebaseAnonymousLogin(String& outIdToken) {
  WiFiClientSecure client; client.setInsecure();
  String url  = String("/v1/accounts:signUp?key=") + API_KEY;
  String body = "{}";
  String resp = httpPostJson(client, "identitytoolkit.googleapis.com", url, body);
  int idx = resp.indexOf("idToken");
  if (idx < 0) return false;
  int q1 = resp.indexOf('"', idx + 8);
  int q2 = resp.indexOf('"', q1 + 1);
  outIdToken = resp.substring(q1 + 1, q2);
  return outIdToken.length() > 0;
}

// ====== 센서/기기 유틸 ======
float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  // SRF05: ECHO HIGH 길이(왕복). 타임아웃 30ms(약 5m 범위)
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  if (duration == 0) return -1; // 타임아웃/오류
  float distance = (duration / 2.0f) * 0.0343f; // cm
  return distance;
}

String statusByDistance(float cm) {
  if (cm < 0)   return "offline";
  if (cm < 100) return "normal";
  if (cm < 200) return "warning";
  return "alert";
}

long readRssiDbm() {
  return WiFi.RSSI(); // dBm
}

int signalLevelFromRssi(long rssi) { // 0~4 막대
  if (rssi >= -55) return 4;
  if (rssi >= -65) return 3;
  if (rssi >= -75) return 2;
  if (rssi >= -85) return 1;
  return 0;
}

#if USE_BATTERY
float readBatteryVoltage() {
  const int N = 8;
  long acc = 0;
  for (int i=0;i<N;i++){ acc += analogRead(A0); delay(2); }
  float raw = acc / (float)N;             // 0~1023
  float vA0 = (raw / 1023.0f) * ADC_REF_V; // A0 전압(0~1.0V)
  float vBat = vA0 * DIV_RATIO;           // 분압 보정 후 실제 배터리 전압
  return vBat;
}
int batteryPercent(float vBat) {
  if (vBat <= BAT_V_MIN) return 0;
  if (vBat >= BAT_V_MAX) return 100;
  return (int)((vBat - BAT_V_MIN) * 100.0f / (BAT_V_MAX - BAT_V_MIN));
}
#endif

// ====== 시간 유틸 ======
// 권장: 초 단위(UTC epoch seconds)로 저장하여 32비트 환경에서도 안전
unsigned long getCurrentTimestampSec() {
  timeClient.update();
  return (unsigned long)timeClient.getEpochTime(); // seconds
}

// ====== 업로드 ======
void postMeasurement(float distanceCm) {
  if (idToken.length() == 0) return;
  WiFiClientSecure client; client.setInsecure();
  unsigned long epochSec = getCurrentTimestampSec(); // NTP 기반 실제 시간(초)

  long  rssi     = readRssiDbm();
  int   sigLevel = signalLevelFromRssi(rssi);

  String status = statusByDistance(distanceCm);
  String valuePart = (distanceCm < 0) ? "null" : String(distanceCm, 1);

  // 공통 필드
  String json = String("{") +
    "\"distance\":"   + valuePart + "," +
    "\"status\":\""   + status    + "\"," +
    "\"timestamp\":"  + String(epochSec) + "," +
    "\"lastUpdate\":" + String(epochSec) + "," +
    "\"deviceId\":\"ESP8266_SRF05_" + String(SITE_ID) + "\"," +
    "\"rssi\":"       + String(rssi) + "," +
    "\"signal\":"     + String(sigLevel);

  // 선택: 배터리 필드
  #if USE_BATTERY
    float vBat   = readBatteryVoltage();
    int   batPct = batteryPercent(vBat);
    json += String(",\"batteryV\":")   + String(vBat, 2) +
           String(",\"batteryPct\":") + String(batPct);
  #endif

  json += "}";

  // 현재값 업데이트 (PATCH 병합: history 형제 노드 보존)
  String urlCur  = String("/sensors/") + SITE_ID + "/" + SENSORKEY + ".json?auth=" + idToken;
  httpPatchJson(client, RTDB_HOST, urlCur, json);

  // 히스토리 업로드 (재활성화)
  String urlHist = String("/sensors/") + SITE_ID + "/" + SENSORKEY + "/history/" + String(epochSec) + ".json?auth=" + idToken;
  httpPutJson(client, RTDB_HOST, urlHist, json);
}

// ====== Arduino 표준 ======
void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi connecting");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi connected");

  // NTP 시간 동기화 시작
  timeClient.begin();
  Serial.print("NTP syncing");
  for (int i = 0; i < 10; i++) {
    if (timeClient.update()) {
      Serial.println("\nNTP sync ok");
      break;
    }
    delay(1000);
    Serial.print(".");
  }

  if (!firebaseAnonymousLogin(idToken)) {
    Serial.println("Firebase anonymous login failed");
  } else {
    Serial.println("Firebase login ok");
  }
}

void loop() {
  unsigned long now = millis();
  if (now - lastPost >= INTERVAL_MS) {
    lastPost = now;
    float cm = readDistanceCm();

    long rssi = readRssiDbm();
    int  sig  = signalLevelFromRssi(rssi);

    #if USE_BATTERY
      float vBat = readBatteryVoltage();
      int   pct  = batteryPercent(vBat);
      Serial.printf("distance=%.1fcm, rssi=%ld dBm, signal=%d/4, batt=%.2fV(%d%%), time=%lu\n", cm, rssi, sig, vBat, pct, getCurrentTimestampSec());
    #else
      Serial.printf("distance=%.1fcm, rssi=%ld dBm, signal=%d/4, time=%lu\n", cm, rssi, sig, getCurrentTimestampSec());
    #endif

    postMeasurement(cm);
  }
}
```

> 참고: 간편화를 위해 HTTPS 인증서 검증은 `setInsecure()`로 생략했으며, 실운영 시 루트 인증서 핀닝을 권장합니다.

추가 참고
- 타임스탬프는 초 단위(UTC)로 올립니다. 프런트엔드는 초/밀리초 모두 처리하지만, 32비트 보드에서 밀리초 곱(×1000)을 잘못 다루면 오버플로우로 미래 시각이 저장되어 오프라인으로 표기될 수 있습니다. 초 단위를 권장합니다.
- 만약 밀리초가 꼭 필요하면 64비트 사용 예:
  ```cpp
  uint64_t epochMs = (uint64_t)timeClient.getEpochTime() * 1000ULL;
  String json = String("{") + "\"timestamp\":" + String((unsigned long long)epochMs) + "}";
  ```

## 7) 기대 동작 (웹 관제)
- 대시보드: 현장 카드/시스템 현황/주요 이슈에 즉시 반영
- 현장 모니터: 실시간 차트/테이블 업데이트, 하드웨어 상태(메타데이터 제공 시) 표시
- 알림: 설정된 임계값 초과/오프라인 기준에 따라 활성/히스토리 생성

## 8) 문제 해결 체크리스트
- 현장 등록 여부: `/sites/{siteId}`가 존재하고 `status: active`
- 경로/키: `/sensors/{siteId}/ultrasonic_1` 경로에 쓰기되는지
- 인증: 익명 로그인 성공, RTDB 규칙 `auth != null`
- 신선도: 하드웨어 관리의 `offline_timeout` 설정 확인(너무 짧으면 곧바로 오프라인 표시)

## 9) 확장 포인트
- NTP로 실제 epoch ms 동기화
- 배터리/신호 등 메타데이터 추가(가능한 경우)
- 여러 센서(ultrasonic_2 …) 동시 운영 시 센서 키만 증가

---

이 가이드를 적용하면, 하드웨어 전원 인가 후 즉시 Firebase로 데이터가 올라가며, 웹 관제에 실시간 반영됩니다.

### 부록) 대안 배선 사용 시 코드 변경 (TRIG=D6, ECHO=D7)
배선이 TRIG→D6, ECHO→D7인 경우 아래처럼 핀 정의만 바꾸면 됩니다. 나머지 코드는 동일합니다.

```cpp
// 대안 배선: TRIG=D6(GPIO12), ECHO=D7(GPIO13)
const int TRIG_PIN = D6; // GPIO12
const int ECHO_PIN = D7; // GPIO13
```

주의: 배선과 코드 정의가 일치해야 거리 측정이 정상 동작합니다. 또한 NTP는 반드시 UTC(오프셋 0)로 설정하고, getCurrentTimestamp는 NTP epoch(ms)를 그대로 사용하세요.
