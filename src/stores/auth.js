import { defineStore } from 'pinia'
import { authApi } from '../api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    initializing: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isReviewer: (state) => state.user?.role === 'reviewer' || state.user?.role === 'admin',
    isSpeaker: (state) => state.user?.role === 'speaker' || state.user?.role === 'admin',
  },

  actions: {
    async login(credentials) {
      this.loading = true
      try {
        const response = await authApi.login(credentials)
        // Handle new ApiResponse format: { status, message, data: { user } }
        this.user = response.data.data?.user || response.data.user
        return response.data
      } finally {
        this.loading = false
      }
    },

    async register(data) {
      this.loading = true
      try {
        const response = await authApi.register(data)
        // Handle new ApiResponse format: { status, message, data: { user } }
        this.user = response.data.data?.user || response.data.user
        return response.data
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await authApi.logout()
      } finally {
        this.user = null
      }
    },

    async fetchUser() {
      // Prevent multiple simultaneous calls
      if (this.initializing) {
        // Wait for the existing call to finish
        while (this.initializing) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
        return this.user
      }
      
      this.initializing = true
      try {
        const response = await authApi.getUser()
        // Handle new ApiResponse format: { status, message, data: { user } }
        this.user = response.data.data?.user || response.data.user
        return this.user
      } catch (error) {
        // Only clear user if it's actually an auth error
        if (error.response?.status === 401) {
        this.user = null
        }
        throw error
      } finally {
        this.initializing = false
      }
    },
  },
})

