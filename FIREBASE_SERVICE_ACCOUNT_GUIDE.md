# 🔑 Firebase Service Account 생성 가이드

Firebase CLI `init hosting:github` 명령어가 브라우저 인증을 요구하므로, 수동으로 Service Account를 생성하는 방법입니다.

## 🎯 **방법 1: Firebase 콘솔에서 직접 생성 (추천)**

### **1단계: Firebase 콘솔 접속**
https://console.firebase.google.com/project/ultrasonic-monitoring-mvp/settings/serviceaccounts/adminsdk

### **2단계: 새 서비스 계정 키 생성**
1. **"Generate new private key"** 버튼 클릭
2. **"Generate key"** 확인 버튼 클릭
3. JSON 파일이 자동 다운로드됩니다

### **3단계: JSON 내용을 GitHub Secret으로 추가**
1. 다운로드된 JSON 파일을 텍스트 에디터로 열기
2. **전체 내용** 복사 (중괄호 포함)
3. GitHub 레포지토리 → Settings → Secrets → Actions
4. **"New repository secret"** 클릭
5. 다음 정보 입력:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_ULTRASONIC_MONITORING_MVP`
   - **Secret:** `{JSON 파일 전체 내용}`

## 🎯 **방법 2: Firebase CLI (브라우저 접속 가능한 경우)**

```bash
firebase init hosting:github
```

위 명령어 실행 후:
1. 브라우저에서 GitHub 로그인
2. 권한 승인
3. GitHub 레포지토리 선택
4. 자동으로 Secret 생성됨

## ⚠️ **중요 사항**

### **Secret 이름 확인**
GitHub Actions 워크플로우에서 사용하는 Secret 이름과 일치해야 합니다:
- 워크플로우: `${{ secrets.FIREBASE_SERVICE_ACCOUNT }}`
- GitHub Secret 이름: `FIREBASE_SERVICE_ACCOUNT` 또는 `FIREBASE_SERVICE_ACCOUNT_ULTRASONIC_MONITORING_MVP`

### **JSON 형식 예시**
생성된 Service Account JSON은 다음과 같은 형태입니다:
```json
{
  "type": "service_account",
  "project_id": "ultrasonic-monitoring-mvp",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@ultrasonic-monitoring-mvp.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
}
```

## ✅ **설정 완료 확인**

모든 GitHub Secrets이 설정되었는지 확인:
- ✅ `VITE_FIREBASE_API_KEY`
- ✅ `VITE_FIREBASE_AUTH_DOMAIN`
- ✅ `VITE_FIREBASE_DATABASE_URL`
- ✅ `VITE_FIREBASE_PROJECT_ID`
- ✅ `VITE_FIREBASE_STORAGE_BUCKET`
- ✅ `VITE_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `VITE_FIREBASE_APP_ID`
- ✅ `FIREBASE_SERVICE_ACCOUNT` (또는 `FIREBASE_SERVICE_ACCOUNT_ULTRASONIC_MONITORING_MVP`)

## 🚀 **테스트 배포**

모든 설정 완료 후:
```bash
git add .
git commit -m "test: trigger GitHub Actions deployment"
git push
```

GitHub Actions 탭에서 배포 진행상황을 확인할 수 있습니다!

---

📞 **문제 발생 시**: GitHub Actions 로그에서 정확한 오류 메시지를 확인하세요.