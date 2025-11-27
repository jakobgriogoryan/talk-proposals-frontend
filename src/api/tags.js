import api from './axios'

export const tagsApi = {
  getAll(params = {}) {
    return api.get('/tags', { params })
  },
  create(name) {
    return api.post('/tags', { name })
  },
}

