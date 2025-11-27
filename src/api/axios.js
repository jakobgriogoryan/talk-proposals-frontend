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
    const method = response.config?.method?.toUpperCase()
    const isFunctionalAction = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    
    if (isFunctionalAction && response.data?.message && (response.status === 200 || response.status === 201)) {
      try {
        const notificationsStore = useNotificationsStore()
        notificationsStore.push(response.data.message, 'success')
      } catch (e) {
        // Store might not be initialized yet
      }
    }
    return response
  },
  (error) => {
    const notificationsStore = useNotificationsStore()
    
    // Exception: Always show errors for 401 (unauthorized) and network errors
    const method = error.config?.method?.toUpperCase()
    const isFunctionalAction = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const isUnauthorized = error.response?.status === 401
    const isNetworkError = !error.response
    
    // Always show network errors and 401 errors
    if (isNetworkError) {
      notificationsStore.push('Network error. Please check your connection.', 'error')
    } else if (isUnauthorized) {
      // 401 errors are handled below with redirect, but we might want to show a message
      // Only show if it's not a user check endpoint
      const url = error.config?.url || ''
      const isUserCheck = url.includes('/user') || url.includes('/sanctum/csrf-cookie')
      if (!isUserCheck && error.response?.data?.message) {
        notificationsStore.push(error.response.data.message, 'error')
      }
    }
    // For other errors, only show if it's a functional action
    else if (isFunctionalAction) {
      // Handle validation errors (422)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors
        // Get first error message from validation errors
        const firstErrorKey = Object.keys(errors)[0]
        const firstErrorMessage = Array.isArray(errors[firstErrorKey])
          ? errors[firstErrorKey][0]
          : errors[firstErrorKey]
        
        if (firstErrorMessage) {
          notificationsStore.push(firstErrorMessage, 'error')
        } else if (error.response?.data?.message) {
          notificationsStore.push(error.response.data.message, 'error')
        }
      }
      // Handle other error responses with message
      else if (error.response?.data?.message) {
        notificationsStore.push(error.response.data.message, 'error')
      }
      // Handle errors without message
      else {
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

