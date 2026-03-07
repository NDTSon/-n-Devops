import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy configuration for local development
    // This allows using relative URLs (/api) instead of full URLs
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Define which env variables to expose to the app
  // All VITE_ prefixed variables are automatically exposed
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  }
})
