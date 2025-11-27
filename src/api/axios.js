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
    
    // Helper function to get user-friendly error messages
    const getUserFriendlyMessage = (error) => {
      // If API provides a message, use it
      if (error.response?.data?.message) {
        return error.response.data.message
      }
      
      // Handle validation errors (422)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors
        const firstErrorKey = Object.keys(errors)[0]
        const firstErrorMessage = Array.isArray(errors[firstErrorKey])
          ? errors[firstErrorKey][0]
          : errors[firstErrorKey]
        if (firstErrorMessage) {
          return firstErrorMessage
        }
      }
      
      // Map status codes to user-friendly messages
      const statusMessages = {
        400: 'Invalid request. Please check your input and try again.',
        401: 'You need to log in to access this resource.',
        403: 'You don\'t have permission to perform this action.',
        404: 'The requested resource could not be found.',
        422: 'Please check your input and try again.',
        500: 'Something went wrong on our end. Please try again later.',
        503: 'Service temporarily unavailable. Please try again later.',
      }
      
      if (error.response?.status) {
        return statusMessages[error.response.status] || 'An unexpected error occurred. Please try again.'
      }
      
      // Network errors
      if (!error.response) {
        return 'Unable to connect to the server. Please check your internet connection and try again.'
      }
      
      return 'An error occurred. Please try again.'
    }
    
    const method = error.config?.method?.toUpperCase()
    const isFunctionalAction = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const isUnauthorized = error.response?.status === 401
    const isNetworkError = !error.response
    
    // Always show user-friendly messages for functional actions, 401, and network errors
    if (isNetworkError || isUnauthorized || isFunctionalAction) {
      const userMessage = getUserFriendlyMessage(error)
      
      // For 401, only show message if it's not a user check endpoint
      if (isUnauthorized) {
        const url = error.config?.url || ''
        const isUserCheck = url.includes('/user') || url.includes('/sanctum/csrf-cookie')
        if (!isUserCheck) {
          notificationsStore.push(userMessage, 'error')
        }
      } else {
        notificationsStore.push(userMessage, 'error')
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

