import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/metadata/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://epss-pod-verification-be.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
