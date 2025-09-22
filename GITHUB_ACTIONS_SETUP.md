# 🚀 GitHub Actions CI/CD 설정 가이드

## 📋 **설정해야 할 GitHub Secrets**

GitHub 레포지토리에서 다음 단계를 따라하세요:

### **1. GitHub 레포지토리 → Settings 메뉴**
1. GitHub.com에서 이 레포지토리 페이지로 이동
2. 상단 메뉴에서 **"Settings"** 클릭
3. 왼쪽 사이드바에서 **"Secrets and variables"** → **"Actions"** 클릭

### **2. 다음 환경변수들을 하나씩 추가**

**"New repository secret" 버튼을 클릭하고 다음 7개를 추가하세요:**

#### 🔑 **Secret 1:**
- **Name:** `VITE_FIREBASE_API_KEY`
- **Secret:** `AIzaSyBtj-sq-J8yEF7Kw2Myytq9xjPrbAHB_XU`

#### 🔑 **Secret 2:**
- **Name:** `VITE_FIREBASE_AUTH_DOMAIN`
- **Secret:** `ultrasonic-monitoring-mvp.firebaseapp.com`

#### 🔑 **Secret 3:**
- **Name:** `VITE_FIREBASE_DATABASE_URL`
- **Secret:** `https://ultrasonic-monitoring-mvp-default-rtdb.firebaseio.com/`

#### 🔑 **Secret 4:**
- **Name:** `VITE_FIREBASE_PROJECT_ID`
- **Secret:** `ultrasonic-monitoring-mvp`

#### 🔑 **Secret 5:**
- **Name:** `VITE_FIREBASE_STORAGE_BUCKET`
- **Secret:** `ultrasonic-monitoring-mvp.firebasestorage.app`

#### 🔑 **Secret 6:**
- **Name:** `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Secret:** `561561067917`

#### 🔑 **Secret 7:**
- **Name:** `VITE_FIREBASE_APP_ID`
- **Secret:** `1:561561067917:web:4f015127e167a62c711dc4`

### **3. Firebase Service Account 설정**

Firebase 콘솔에서 서비스 계정을 생성해야 합니다:

#### **방법 1: Firebase CLI 사용 (추천)**
터미널에서 다음 명령어 실행:
```bash
firebase init hosting:github
```
이 명령어가 자동으로 GitHub 레포지토리에 `FIREBASE_SERVICE_ACCOUNT` secret을 추가합니다.

#### **방법 2: 수동 생성**
1. [Firebase Console](https://console.firebase.google.com/project/ultrasonic-monitoring-mvp/settings/serviceaccounts/adminsdk) 이동
2. "Generate new private key" 클릭
3. 다운로드된 JSON 파일 내용 전체를 복사
4. GitHub Secrets에 다음으로 추가:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT`
   - **Secret:** `{전체 JSON 내용}`

## ✅ **설정 완료 후 테스트**

모든 Secrets이 설정되면:

1. 코드 수정 후 `git push` 실행
2. GitHub Actions 탭에서 빌드 진행상황 확인
3. 성공하면 자동으로 https://ultrasonic-monitoring-mvp.web.app 업데이트!

## 🔍 **GitHub Actions 상태 확인**

- GitHub 레포지토리 → **"Actions"** 탭에서 배포 진행상황 확인
- 빌드 실패 시 로그에서 오류 내용 확인 가능

## 🎉 **완료되면**

앞으로는 코드 수정 후 `git push`만 하면 자동으로:
- 빌드 → 테스트 → 배포가 진행됩니다!
- 수동 `npm run build`, `firebase deploy` 불필요!

---

📞 **문제 발생 시**: GitHub Actions 탭의 오류 로그를 확인하거나 Claude에게 문의하세요!