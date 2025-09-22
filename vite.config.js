import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { config } from 'dotenv'

// .env 파일 명시적 로드
config()

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // 모든 인터페이스에서 접속 허용
      port: 5173,
      strictPort: false, // 포트가 사용 중일 때 다른 포트 사용
    },
    // 환경변수 명시적 정의
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
      'import.meta.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify(process.env.VITE_FIREBASE_DATABASE_URL),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID),
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(process.env.VITE_ENVIRONMENT || 'production'),
    },
    build: {
      // 번들 크기 최적화
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            // React 관련 라이브러리 분리
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Firebase 라이브러리 분리
            'firebase-vendor': ['firebase/app', 'firebase/database'],
            // Charts 라이브러리 분리 (가장 큰 번들)
            'charts-vendor': ['recharts'],
          },
        },
      },
      // 개발용 console.log는 유지, 프로덕션에서만 제거
      minify: command === 'build' ? 'terser' : false,
      terserOptions: command === 'build' ? {
        compress: {
          drop_console: false, // 디버깅을 위해 일시적으로 유지
          drop_debugger: true,
        },
      } : undefined,
    },
  }
})
