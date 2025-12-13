import { defineStore } from 'pinia'
import { authApi } from '../api/auth'
import { extractUserFromResponse } from '../utils/apiHelpers'

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
        this.user = extractUserFromResponse(response)

        return response.data
      } finally {
        this.loading = false
      }
    },

    async register(data) {
      this.loading = true
      try {
        const response = await authApi.register(data)
        this.user = extractUserFromResponse(response)

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
      if (this.initializing) {
        while (this.initializing) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        return this.user
      }

      this.initializing = true
      try {
        const response = await authApi.getUser()
        this.user = extractUserFromResponse(response)

        return this.user
      } catch (error) {
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

