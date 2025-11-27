import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'

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
    const method = response.config?.method?.toUpperCase()
    const isFunctionalAction = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    
    if (isFunctionalAction && response.data?.message && (response.status === 200 || response.status === 201)) {
      try {
        const notificationsStore = useNotificationsStore()
        notificationsStore.push(response.data.message, 'success')
      } catch (e) {}
    }
    return response
  },
  (error) => {
    const notificationsStore = useNotificationsStore()
    
    const method = error.config?.method?.toUpperCase()
    const isFunctionalAction = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const isUnauthorized = error.response?.status === 401
    const isNetworkError = !error.response
    
    if (isNetworkError) {
      notificationsStore.push('Network error. Please check your connection.', 'error')
    } else if (isUnauthorized) {
      const url = error.config?.url || ''
      const isUserCheck = url.includes('/user') || url.includes('/sanctum/csrf-cookie')
      if (!isUserCheck && error.response?.data?.message) {
        notificationsStore.push(error.response.data.message, 'error')
      }
    } else if (isFunctionalAction) {
      // Handle validation errors (422)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors

        const firstErrorKey = Object.keys(errors)[0]
        const firstErrorMessage = Array.isArray(errors[firstErrorKey])
          ? errors[firstErrorKey][0]
          : errors[firstErrorKey]
        
        if (firstErrorMessage) {
          notificationsStore.push(firstErrorMessage, 'error')
        } else if (error.response?.data?.message) {
          notificationsStore.push(error.response.data.message, 'error')
        }
      } else if (error.response?.data?.message) {
        notificationsStore.push(error.response.data.message, 'error')
      } else {
        const statusMessages = {
          400: 'Bad request',
          403: 'Forbidden',
          404: 'Resource not found',
          500: 'Server error',
        }
        const message = statusMessages[error.response.status] || 'An error occurred'
        notificationsStore.push(message, 'error')
      }
    }

    // Handle 401 unauthorized - redirect to login
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      const isUserCheck = url.includes('/user') || url.includes('/sanctum/csrf-cookie')
      
      if (!isUserCheck) {
        // Clear user from store
        try {
          const authStore = useAuthStore()
          if (authStore) {
            authStore.user = null
          }
        } catch (e) {}
        
        const currentPath = window.location.pathname
        const isOnAuthPage = currentPath === '/login' || currentPath === '/register'
        
        if (!isOnAuthPage) {
          try {
            setTimeout(() => {
              const currentPathAfterDelay = window.location.pathname
              if (currentPathAfterDelay !== '/login' && currentPathAfterDelay !== '/register') {
                window.location.href = '/login'
              }
            }, 200)
          } catch (e) {}
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default api

