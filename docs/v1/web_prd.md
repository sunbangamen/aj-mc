🌐 웹 PRD (ultrasonic-live)
1. 개요

목표: Firebase Realtime Database에 업로드된 초음파 센서 데이터를 웹에서 실시간으로 수신하고 표시한다.

환경: Vite + React (WSL Ubuntu 로컬 개발, Firebase Hosting 배포)

2. 기능 요구사항
🔌 데이터 연동

Firebase SDK 연동 (Realtime Database)

DB 경로: /sensors/d1/ultrasonic

📊 데이터 표시

최신 거리(cm) 값을 큰 숫자로 표시

최근 20개 측정 로그를 시간순 리스트로 표시

🔄 실시간 반영

Firebase 값이 변경되면 웹 UI가 자동 업데이트

새 값 수신 시 화면에 반영 (새로고침 불필요)

3. 성공 기준 (AC)

 웹 접속 시 1초 이내 최신값 표시

 Firebase DB 변경 시 자동 업데이트 반영

 최근 20개 데이터 시간순으로 표시

4. 비기능 요구사항 (DoD)

로컬 실행: npm run dev로 접속 가능

Firebase Hosting 배포 가능 (firebase deploy)

코드/문서/환경변수 분리:

src/firebase.js → Firebase 설정

.env → API Key 등 환경변수

README.md → 실행/배포 방법 정리