import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/oauth2': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/login/oauth2': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      }
    }
  }
})
