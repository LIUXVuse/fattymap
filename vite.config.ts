import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 地圖相關獨立一包，首頁不需要的等需要時再載
          'leaflet-vendor': ['leaflet', 'react-leaflet'],
          // Firebase 獨立一包
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // React 核心
          'react-vendor': ['react', 'react-dom'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      // 台灣 FinMind API proxy
      '/api/finmind': {
        target: 'https://api.finmindtrade.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/finmind/, ''),
      },
      // 泰國央行 BOT API proxy
      '/api/bot': {
        target: 'https://gateway.api.bot.or.th',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bot/, ''),
      },
    },
  },
})