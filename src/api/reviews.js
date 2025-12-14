import api from './axios'
import { useCacheStore } from '../stores/cache'

export const reviewsApi = {
  getRatingOptions() {
    const cacheKey = 'reviews:rating-options'
    const cacheStore = useCacheStore()

    const cached = cacheStore.get(cacheKey)
    if (cached) {
      return Promise.resolve({ data: cached })
    }

    return api.get('/reviews/rating-options')
        .then(response => {
          // Cache rating options for 1 hour (rarely changes)
          cacheStore.set(cacheKey, response.data, 60 * 60 * 1000)
          return response
        })
  },
  getForProposal(proposalId, params = {}) {
    const cacheKey = `reviews:proposal:${proposalId}:${JSON.stringify(params)}`
    const cacheStore = useCacheStore()

    const cached = cacheStore.get(cacheKey)
    if (cached) {
      return Promise.resolve({ data: cached })
    }

    return api.get(`/proposals/${proposalId}/reviews`, { params })
        .then(response => {
          // Cache reviews for 2 minutes
          cacheStore.set(cacheKey, response.data, 2 * 60 * 1000)
          return response
        })
  },
  create(proposalId, data) {
    return api.post(`/proposals/${proposalId}/reviews`, data)
        .then(response => {
          // Invalidate reviews cache on create
          const cacheStore = useCacheStore()
          cacheStore.cache.forEach((_, key) => {
            if (key.startsWith(`reviews:proposal:${proposalId}:`)) {
              cacheStore.delete(key)
            }
          })
          return response
        })
  },
  update(proposalId, reviewId, data) {
    return api.put(`/proposals/${proposalId}/reviews/${reviewId}`, data)
        .then(response => {
          // Invalidate reviews cache on update
          const cacheStore = useCacheStore()
          cacheStore.cache.forEach((_, key) => {
            if (key.startsWith(`reviews:proposal:${proposalId}:`)) {
              cacheStore.delete(key)
            }
          })
          return response
        })
  },
}

