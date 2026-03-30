import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const BACKEND_HOST = env.VITE_BACKEND_HOST
  const USER_PORT = env.VITE_BACKEND_USER_PORT
  const BLOG_PORT = env.VITE_BACKEND_BLOG_PORT
  const FILE_PORT = env.VITE_BACKEND_FILE_PORT
  const INTERACTION_PORT = env.VITE_BACKEND_INTERACTION_PORT || 8086
  const CUSTOMER_PORT = env.VITE_BACKEND_CUSTOMER_PORT || 8087

  return {
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/auth':          { target: `http://${BACKEND_HOST}:${USER_PORT}`, changeOrigin: true, secure: false },
      '/api/users':         { target: `http://${BACKEND_HOST}:${USER_PORT}`, changeOrigin: true, secure: false },
      '/api/follow':        { target: `http://${BACKEND_HOST}:${USER_PORT}`, changeOrigin: true, secure: false },
      '/api/notifications': { target: `http://${BACKEND_HOST}:${INTERACTION_PORT}`, changeOrigin: true, secure: false },
      '/api/messages':      { target: `http://${BACKEND_HOST}:${INTERACTION_PORT}`, changeOrigin: true, secure: false },
      '/api/blogs':         { target: `http://${BACKEND_HOST}:${BLOG_PORT}`, changeOrigin: true, secure: false },
      '/api/categories':    { target: `http://${BACKEND_HOST}:${BLOG_PORT}`, changeOrigin: true, secure: false },
      '/api/comments':      { target: `http://${BACKEND_HOST}:${INTERACTION_PORT}`, changeOrigin: true, secure: false },
      '/api/uploads':       { target: `http://${BACKEND_HOST}:${BLOG_PORT}`, changeOrigin: true, secure: false },
      '/api/files':         { target: `http://${BACKEND_HOST}:${FILE_PORT}`, changeOrigin: true, secure: false },
      '/api/support':       { target: `http://${BACKEND_HOST}:${CUSTOMER_PORT}`, changeOrigin: true, secure: false },
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  }
  }
})
