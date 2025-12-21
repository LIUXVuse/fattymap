import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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