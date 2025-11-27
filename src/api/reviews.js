import api from './axios'

export const reviewsApi = {
  getRatingOptions() {
    return api.get('/reviews/rating-options')
  },
  getForProposal(proposalId) {
    return api.get(`/proposals/${proposalId}/reviews`)
  },
  create(proposalId, data) {
    return api.post(`/proposals/${proposalId}/reviews`, data)
  },
  update(proposalId, reviewId, data) {
    return api.put(`/proposals/${proposalId}/reviews/${reviewId}`, data)
  },
}

