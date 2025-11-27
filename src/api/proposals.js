import api from './axios'

export const proposalsApi = {
  getAll(params = {}) {
    return api.get('/proposals', { params })
  },
  getOne(id) {
    return api.get(`/proposals/${id}`)
  },
  create(data) {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('file', data.file)
    data.tags.forEach(tag => {
      formData.append('tags[]', tag)
    })
    return api.post('/proposals', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  update(id, data) {
    const formData = new FormData()
    if (data.title) formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.file) formData.append('file', data.file)
    if (data.tags) {
      data.tags.forEach(tag => {
        formData.append('tags[]', tag)
      })
    }
    formData.append('_method', 'PUT')
    return api.post(`/proposals/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  delete(id) {
    return api.delete(`/proposals/${id}`)
  },
  getForReview(params = {}) {
    return api.get('/review/proposals', { params })
  },
  updateStatus(id, status) {
    return api.patch(`/admin/proposals/${id}/status`, { status })
  },
  getAllForAdmin(params = {}) {
    return api.get('/admin/proposals', { params })
  },
  getTopRated(limit = 10) {
    return api.get('/proposals/top-rated', { params: { limit } })
  },
}

