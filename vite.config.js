import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/sportner/',

  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: 'https://sportech-store.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
})