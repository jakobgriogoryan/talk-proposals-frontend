import api from './axios'
import { cachedGet, invalidateOnSuccess } from './cache'

export const reviewsApi = {
  getRatingOptions() {
    return cachedGet('/reviews/rating-options', 'reviews:rating-options', 60 * 60 * 1000)
  },
  getForProposal(proposalId, params = {}) {
    return cachedGet(`/proposals/${proposalId}/reviews`,
      `reviews:proposal:${proposalId}:${JSON.stringify(params)}`, 2 * 60 * 1000, params)
  },
  create(proposalId, data) {
    return invalidateOnSuccess(api.post(`/proposals/${proposalId}/reviews`, data),
      `reviews:proposal:${proposalId}:`, 'proposals:')
  },
  update(proposalId, reviewId, data) {
    return invalidateOnSuccess(api.put(`/proposals/${proposalId}/reviews/${reviewId}`, data),
      `reviews:proposal:${proposalId}:`, 'proposals:')
  },
}
