import api from './axios'
import { useCacheStore } from '../stores/cache'

export const tagsApi = {
  getAll(params = {}) {
    const cacheKey = `tags:all:${JSON.stringify(params)}`
    const cacheStore = useCacheStore()

    const cached = cacheStore.get(cacheKey)
    if (cached) {
      return Promise.resolve({ data: cached })
    }

    return api.get('/tags', { params })
        .then(response => {
          // Cache tags for 1 hour (matches backend cache TTL)
          cacheStore.set(cacheKey, response.data, 60 * 60 * 1000)
          return response
        })
  },
  create(name) {
    return api.post('/tags', { name })
        .then(response => {
          // Invalidate tags cache on create
          const cacheStore = useCacheStore()
          cacheStore.cache.forEach((_, key) => {
            if (key.startsWith('tags:')) {
              cacheStore.delete(key)
            }
          })
          return response
        })
  },
}

