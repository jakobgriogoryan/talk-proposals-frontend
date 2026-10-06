import api from './axios'
import { cachedGet, invalidateOnSuccess } from './cache'

const LIST_TTL = 60 * 1000

export const proposalsApi = {
  getAll(params = {}) {
    return cachedGet('/proposals', `proposals:all:${JSON.stringify(params)}`, LIST_TTL, params)
  },
  getOne(id) {
    return cachedGet(`/proposals/${id}`, `proposals:one:${id}`, 5 * 60 * 1000)
  },
  create(data) {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    if (data.file) formData.append('file', data.file)
    for (const tag of data.tags || []) formData.append('tags[]', tag)

    return invalidateOnSuccess(api.post('/proposals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }), 'proposals:')
  },
  update(id, data) {
    const formData = new FormData()
    if (data.title !== undefined) formData.append('title', data.title ?? '')
    if (data.description !== undefined) formData.append('description', data.description ?? '')
    if (data.file) formData.append('file', data.file)
    if (data.tags) {
      if (data.tags.length === 0) {
        // Multipart has no native representation of an empty array.
        formData.append('tags', '[]')
      } else {
        for (const tag of data.tags) formData.append('tags[]', tag)
      }
    }
    formData.append('_method', 'PUT')
    return invalidateOnSuccess(api.post(`/proposals/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }), 'proposals:')
  },
  delete(id) {
    return invalidateOnSuccess(api.delete(`/proposals/${id}`), 'proposals:', `reviews:proposal:${id}:`)
  },
  getForReview(params = {}) {
    return cachedGet('/review/proposals', `proposals:review:${JSON.stringify(params)}`, LIST_TTL, params)
  },
  updateStatus(id, status) {
    return invalidateOnSuccess(api.patch(`/admin/proposals/${id}/status`, { status }), 'proposals:')
  },
  getAllForAdmin(params = {}) {
    return cachedGet('/admin/proposals', `proposals:admin:${JSON.stringify(params)}`, LIST_TTL, params)
  },
  getTopRated(limit = 10) {
    return cachedGet('/proposals/top-rated', `proposals:top-rated:${limit}`, 15 * 60 * 1000, { limit })
  },
  download(id) {
    return api.get(`/proposals/${id}/download`, { responseType: 'blob' })
  },
}
