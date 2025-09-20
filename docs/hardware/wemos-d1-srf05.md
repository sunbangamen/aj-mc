# Wemos D1 (ESP8266) + SRF05 초음파 센서 연결 가이드 (Firebase 실운영)

이 문서만 따라 하면 하드웨어가 Firebase RTDB에 즉시 데이터를 올리고, 웹 관제에 바로 반영됩니다.

## 1) 준비물
- Wemos D1 (ESP8266)
- SRF05 초음파 센서 (TRIG / ECHO 분리형)
- 점퍼 케이블, 5V 전원 (보드 USB 전원 사용 가능)
- Arduino IDE (보드 매니저에 ESP8266 설치)

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

// ====== 사용자 설정 ======
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

const char* API_KEY   = "YOUR_FIREBASE_WEB_API_KEY"; // Firebase Web API Key
const char* RTDB_HOST = "<project-id>-default-rtdb.firebaseio.com"; // 예: myproj-default-rtdb.firebaseio.com

const char* SITE_ID   = "site_wemos1";     // 생성한 현장 ID
const char* SENSORKEY = "ultrasonic_1";    // 비패딩 규칙

// 핀 설정 (SRF05)
const int TRIG_PIN = D5; // GPIO14
const int ECHO_PIN = D6; // GPIO12

// 주기(밀리초)
unsigned long INTERVAL_MS = 3000; // 3초

// ====== 내부 상태 ======
String idToken = "";
unsigned long lastPost = 0;

// ====== 유틸 ======
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
  // 간단 파서: 헤더 스킵 후 바디 리턴
  String line, body;
  bool headerEnded = false;
  while (client.connected() || client.available()) {
    line = client.readStringUntil('\n');
    if (!headerEnded) {
      if (line == "\r") headerEnded = true;
    } else {
      body += line;
    }
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

bool firebaseAnonymousLogin(String& outIdToken) {
  WiFiClientSecure client; client.setInsecure();
  String url = String("/v1/accounts:signUp?key=") + API_KEY;
  String body = "{}"; // 익명 로그인
  String resp = httpPostJson(client, "identitytoolkit.googleapis.com", url, body);
  // 매우 단순 파싱(실전은 JSON 파서 권장)
  int idx = resp.indexOf("idToken");
  if (idx < 0) return false;
  int q1 = resp.indexOf('"', idx + 8);
  int q2 = resp.indexOf('"', q1 + 1);
  outIdToken = resp.substring(q1 + 1, q2);
  return outIdToken.length() > 0;
}

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL); // 30ms 타임아웃
  if (duration == 0) return -1; // 타임아웃
  float distance = (duration / 2.0) * 0.0343; // cm
  return distance;
}

String statusByDistance(float cm) {
  if (cm < 0) return "offline";
  if (cm < 100) return "normal";
  if (cm < 200) return "warning";
  return "alert";
}

void postMeasurement(float distanceCm) {
  if (idToken.length() == 0) return;
  WiFiClientSecure client; client.setInsecure();
  unsigned long epochMs = (unsigned long)(millis()); // 필요시 NTP 적용
  String site(SITE_ID), key(SENSORKEY);

  // payload
  String status = statusByDistance(distanceCm);
  String valuePart = (distanceCm < 0) ? "null" : String(distanceCm, 1);
  String json = String("{") +
                "\"distance\":" + valuePart + "," +
                "\"status\":\"" + status + "\"," +
                "\"timestamp\":" + String(epochMs) + "," +
                "\"lastUpdate\":" + String(epochMs) + "," +
                "\"deviceId\":\"WEMOS_SRF05_" + site + "\"" +
                "}";

  // 현재값 업데이트
  String urlCur = String("/sensors/") + site + "/" + key + ".json?auth=" + idToken;
  httpPutJson(client, RTDB_HOST, urlCur, json);

  // 히스토리 추가
  String urlHist = String("/sensors/") + site + "/" + key + "/history/" + String(epochMs) + ".json?auth=" + idToken;
  httpPutJson(client, RTDB_HOST, urlHist, json);
}

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi connecting");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi connected");

  // Firebase 익명 로그인
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
    Serial.printf("distance=%.1fcm\n", cm);
    postMeasurement(cm);
  }
}
```

> 참고: 간편화를 위해 HTTPS 인증서 검증은 `setInsecure()`로 생략했으며, 실운영 시 루트 인증서 핀닝을 권장합니다.

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
