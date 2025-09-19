import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '.lindy.site',
      '.e2b.app',
      '3000-i08ygb6atkik4es3gtgn4.e2b.app'
    ]
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
