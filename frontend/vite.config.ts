import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Zapytania do /api przekazujemy do backendu (FastAPI na porcie 8000).
    // 127.0.0.1 zamiast localhost: Node wybiera IPv6, a uvicorn nasłuchuje na IPv4.
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
