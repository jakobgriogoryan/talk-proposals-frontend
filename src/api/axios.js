import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Ensure credentials are sent with every request
    config.withCredentials = true
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect for /user endpoint (used to check auth status)
      // or if already on login/register page
      const url = error.config?.url || ''
      const isUserCheck = url.includes('/user') || url.includes('/sanctum/csrf-cookie')
      const currentPath = window.location.pathname
      const isOnAuthPage = currentPath === '/login' || currentPath === '/register'
      
      if (!isUserCheck && !isOnAuthPage) {
        // Clear user from store
        try {
          const authStore = useAuthStore()
          if (authStore) {
            authStore.user = null
          }
        } catch (e) {
          // Store might not be initialized yet
        }
        
        // Only redirect after a small delay to avoid interfering with router navigation
        setTimeout(() => {
          const currentPathAfterDelay = window.location.pathname
          if (currentPathAfterDelay !== '/login' && currentPathAfterDelay !== '/register') {
      window.location.href = '/login'
          }
        }, 100)
      }
    }
    return Promise.reject(error)
  }
)

export default api

