import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 모든 인터페이스에서 접속 허용
    port: 5173,
    strictPort: false, // 포트가 사용 중일 때 다른 포트 사용
  },
})
