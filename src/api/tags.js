import api from './axios'
import { cachedGet, invalidateOnSuccess } from './cache'

export const tagsApi = {
  getAll(params = {}) {
    return cachedGet('/tags', `tags:all:${JSON.stringify(params)}`, 60 * 60 * 1000, params)
  },
  create(name) {
    return invalidateOnSuccess(api.post('/tags', { name }), 'tags:')
  },
}
