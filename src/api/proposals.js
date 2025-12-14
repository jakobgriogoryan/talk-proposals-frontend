import api from './axios'
import { useCacheStore } from '../stores/cache'

export const proposalsApi = {
  getAll(params = {}) {
    // Generate cache key from params
    const cacheKey = `proposals:all:${JSON.stringify(params)}`
    const cacheStore = useCacheStore()

    // Check cache first
    const cached = cacheStore.get(cacheKey)
    if (cached) {
      return Promise.resolve({ data: cached })
    }

    // Fetch and cache
    return api.get('/proposals', { params }).then(response => {
      // Cache for 1 minute
      cacheStore.set(cacheKey, response.data, 60 * 1000)
      return response
    })
  },
  getOne(id) {
    const cacheKey = `proposals:one:${id}`
    const cacheStore = useCacheStore()

    const cached = cacheStore.get(cacheKey)
    if (cached) {
      return Promise.resolve({ data: cached })
    }

    return api.get(`/proposals/${id}`)
        .then(response => {
          // Cache for 5 minutes
          cacheStore.set(cacheKey, response.data, 5 * 60 * 1000)
          return response
        })
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
        .then(response => {
          // Invalidate cache on create
          const cacheStore = useCacheStore()
          cacheStore.cache.forEach((_, key) => {
            if (key.startsWith('proposals:')) {
              cacheStore.delete(key)
            }
          })
          return response
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
        .then(response => {
          // Invalidate cache on update
          const cacheStore = useCacheStore()
          cacheStore.delete(`proposals:one:${id}`)
          cacheStore.cache.forEach((_, key) => {
            if (key.startsWith('proposals:all:')) {
              cacheStore.delete(key)
            }
          })
          return response
        })
  },
  delete(id) {
    return api.delete(`/proposals/${id}`)
        .then(response => {
          // Invalidate cache on delete
          const cacheStore = useCacheStore()
          cacheStore.delete(`proposals:one:${id}`)
          cacheStore.cache.forEach((_, key) => {
            if (key.startsWith('proposals:all:') || key.startsWith('proposals:')) {
              cacheStore.delete(key)
            }
          })
          return response
        })
  },
  getForReview(params = {}) {
    const cacheKey = `proposals:review:${JSON.stringify(params)}`
    const cacheStore = useCacheStore()

    const cached = cacheStore.get(cacheKey)
    if (cached) {
      return Promise.resolve({ data: cached })
    }

    return api.get('/review/proposals', { params })
        .then(response => {
          cacheStore.set(cacheKey, response.data, 60 * 1000)
          return response
        })
  },
  updateStatus(id, status) {
    return api.patch(`/admin/proposals/${id}/status`, { status })
        .then(response => {
          // Invalidate cache on status update
          const cacheStore = useCacheStore()
          cacheStore.delete(`proposals:one:${id}`)
          cacheStore.cache.forEach((_, key) => {
            if (key.startsWith('proposals:')) {
              cacheStore.delete(key)
            }
          })
          return response
        })
  },
  getAllForAdmin(params = {}) {
    const cacheKey = `proposals:admin:${JSON.stringify(params)}`
    const cacheStore = useCacheStore()

    const cached = cacheStore.get(cacheKey)
    if (cached) {
      return Promise.resolve({ data: cached })
    }

    return api.get('/admin/proposals', { params })
        .then(response => {
          cacheStore.set(cacheKey, response.data, 60 * 1000)
          return response
        })
  },
  getTopRated(limit = 10) {
    const cacheKey = `proposals:top-rated:${limit}`
    const cacheStore = useCacheStore()

    const cached = cacheStore.get(cacheKey)
    if (cached) {
      return Promise.resolve({ data: cached })
    }

    return api.get('/proposals/top-rated', { params: { limit } })
        .then(response => {
          // Cache top-rated for 15 minutes (matches backend cache TTL)
          cacheStore.set(cacheKey, response.data, 15 * 60 * 1000)
          return response
        })
  },
}

