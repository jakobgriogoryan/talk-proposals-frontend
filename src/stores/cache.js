import { defineStore } from 'pinia'

/**
 * Store for caching API responses
 */
export const useCacheStore = defineStore('cache', {
  state: () => ({
    // Cache structure: { key: { data, timestamp, ttl } }
    cache: new Map(),
  }),

  getters: {
    /**
     * Get cached data if not expired
     */
    get: (state) => (key) => {
      const cached = state.cache.get(key)
      if (!cached) return null

      const now = Date.now()
      if (now - cached.timestamp > cached.ttl) {
        // Expired, remove from cache
        state.cache.delete(key)
        return null
      }

      return cached.data
    },

    /**
     * Check if key exists and is valid
     */
    has: (state) => (key) => {
      const cached = state.cache.get(key)
      if (!cached) return false

      const now = Date.now()
      if (now - cached.timestamp > cached.ttl) {
        state.cache.delete(key)
        return false
      }

      return true
    },
  },

  actions: {
    /**
     * Set cache entry
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
     */
    set(key, data, ttl = 5 * 60 * 1000) {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      })
    },

    /**
     * Remove cache entry
     */
    delete(key) {
      this.cache.delete(key)
    },

    /**
     * Clear all cache
     */
    clear() {
      this.cache.clear()
    },

    /**
     * Clear expired entries
     */
    clearExpired() {
      const now = Date.now()
      for (const [key, cached] of this.cache.entries()) {
        if (now - cached.timestamp > cached.ttl) {
          this.cache.delete(key)
        }
      }
    },
  },
})

