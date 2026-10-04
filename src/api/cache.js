import api from './axios'
import { useCacheStore } from '../stores/cache'

/** Cache successful GET data without allowing invalidated requests to refill it. */
export async function cachedGet(url, key, ttl, params) {
  const cache = useCacheStore()
  if (cache.has(key)) return { data: cache.get(key) }

  const generation = cache.generation
  const response = await api.get(url, params === undefined ? undefined : { params })
  if (cache.generation === generation) cache.set(key, response.data, ttl)
  return response
}

/** Capture the current store before awaiting, and invalidate only on success. */
export function invalidateOnSuccess(request, ...prefixes) {
  const cache = useCacheStore()
  return request.then(response => {
    for (const prefix of prefixes) cache.invalidatePrefix(prefix)
    return response
  })
}
