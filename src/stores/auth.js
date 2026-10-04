import { defineStore } from 'pinia'
import { authApi } from '../api/auth'
import { extractUserFromResponse } from '../utils/apiHelpers'
import { useCacheStore } from './cache'

// In-flight requests belong to a store, not to every Pinia instance in the app/tests.
const userRequests = new WeakMap()

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    initializing: false,
    sessionVersion: 0,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isReviewer: (state) => state.user?.role === 'reviewer' || state.user?.role === 'admin',
    isSpeaker: (state) => state.user?.role === 'speaker' || state.user?.role === 'admin',
  },

  actions: {
    setUser(user) {
      this.sessionVersion++
      if (this.user?.id !== user?.id || this.user?.role !== user?.role) {
        useCacheStore().clear()
      }
      this.user = user
    },

    async login(credentials) {
      this.loading = true
      try {
        const response = await authApi.login(credentials)
        this.setUser(extractUserFromResponse(response))

        return response.data
      } finally {
        this.loading = false
      }
    },

    async register(data) {
      this.loading = true
      try {
        const response = await authApi.register(data)
        this.setUser(extractUserFromResponse(response))

        return response.data
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await authApi.logout()
      } finally {
        useCacheStore().clear()
        this.setUser(null)
      }
    },

    fetchUser() {
      const pending = userRequests.get(this)
      if (pending) return pending

      const version = this.sessionVersion
      this.initializing = true
      const request = (async () => {
        try {
          const response = await authApi.getUser()
          // Login/logout or an identity change supersedes this request.
          if (version !== this.sessionVersion) return this.user

          const user = response.status === 401 || !response.data
            ? null : extractUserFromResponse(response)
          this.setUser(user)
          return this.user
        } catch (error) {
          if (version !== this.sessionVersion) return this.user
          if (error.response?.status === 401) {
            this.setUser(null)
            return null
          }
          throw error
        }
      })().finally(() => {
        this.initializing = false
        userRequests.delete(this)
      })
      userRequests.set(this, request)
      return request
    },
  },
})
