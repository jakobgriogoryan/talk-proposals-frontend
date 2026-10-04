import { defineStore } from 'pinia'

function validEntry(state, key) {
  const entry = state.cache.get(key)
  return entry && Date.now() - entry.timestamp < entry.ttl ? entry : null
}

/**
 * Store for caching API responses
 */
export const useCacheStore = defineStore('cache', {
  state: () => ({
    // Cache structure: { key: { data, timestamp, ttl } }
    cache: new Map(),
    // Requests started before invalidation must not repopulate stale data.
    generation: 0,
  }),

  getters: {
    /**
     * Get cached data if not expired
     */
    get: (state) => (key) => validEntry(state, key)?.data ?? null,

    /**
     * Check if key exists and is valid
     */
    has: (state) => (key) => validEntry(state, key) !== null,
  },

  actions: {
    /**
     * Set cache entry
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
     */
    set(key, data, ttl = 5 * 60 * 1000) {
      this.clearExpired()
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
      this.generation++
      this.cache.delete(key)
    },

    invalidatePrefix(prefix) {
      this.generation++
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) this.cache.delete(key)
      }
    },

    /**
     * Clear all cache
     */
    clear() {
      this.generation++
      this.cache.clear()
    },

    /**
     * Clear expired entries
     */
    clearExpired() {
      const now = Date.now()
      for (const [key, cached] of this.cache.entries()) {
        if (now - cached.timestamp >= cached.ttl) {
          this.cache.delete(key)
        }
      }
    },
  },
})
