import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Procurement traffic goes to the split-out erp-procurement microservice
      // on port 3016. Must come before '/api' so the more specific prefix wins.
      '/api/procurement': {
        target: 'http://localhost:3016',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3004',
        changeOrigin: true,
      },
    },
  },
})
