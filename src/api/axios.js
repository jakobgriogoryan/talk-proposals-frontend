import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { getCsrfCookie } from './auth'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

// Request interceptor - fetch CSRF cookie for stateful requests
api.interceptors.request.use(
  async (config) => {
    config.withCredentials = true

    // Fetch CSRF cookie for stateful requests (POST, PUT, PATCH, DELETE)
    const method = config.method?.toUpperCase()
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !config._csrfRetried) {
      await getCsrfCookie()
    }

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
  async (error) => {
    const notificationsStore = useNotificationsStore()

    // Recover once, before notifying. A second 419 is a terminal failure.
    if (error.response?.status === 419 && error.config && !error.config._csrfRetried) {
      error.config._csrfRetried = true
      try {
        await getCsrfCookie()
      } catch (refreshError) {
        notificationsStore.push('Session expired. Please refresh the page and try again.', 'error')
        return Promise.reject(error)
      }
      return api.request(error.config)
    }

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
        419: 'Session expired. Please refresh the page and try again.',
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

    // Suppress console errors for expected 401s on user check endpoints
    const url = error.config?.url || ''
    const isUserCheck = url.includes('/user') || url.includes('/sanctum/csrf-cookie')
    const isExpected401 = error.response?.status === 401 && isUserCheck

    // Always show user-friendly messages for functional actions, 401, and network errors
    // But skip expected 401s on user check endpoints (they're normal for unauthenticated users)
    if (isNetworkError || (isUnauthorized && !isExpected401) || isFunctionalAction) {
      const userMessage = getUserFriendlyMessage(error)
      
      // For 401, only show message if it's not a user check endpoint
      if (isUnauthorized && !isExpected401) {
        notificationsStore.push(userMessage, 'error')
      } else if (!isUnauthorized) {
        notificationsStore.push(userMessage, 'error')
      }
    }

    // Handle 401 unauthorized - redirect to login
    if (error.response?.status === 401) {
      // For expected 401s on user check endpoints, return a resolved promise with proper axios response structure
      // This prevents the error from being logged to console (they're normal for unauthenticated users)
      if (isExpected401) {
        // Return a proper axios response object to prevent error logging
        return Promise.resolve({
          data: null,
          status: 401,
          statusText: 'Unauthorized',
          headers: error.response?.headers || {},
          config: error.config,
          request: error.request,
        })
      }
      
      // For unexpected 401s, handle normally
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

    return Promise.reject(error)
  }
)

export default api
