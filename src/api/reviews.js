import api from './axios'

export const reviewsApi = {
  getForProposal(proposalId) {
    return api.get(`/proposals/${proposalId}/reviews`)
  },
  create(proposalId, data) {
    return api.post(`/proposals/${proposalId}/reviews`, data)
  },
}

