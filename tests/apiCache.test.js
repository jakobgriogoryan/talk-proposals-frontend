import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(),
  login: vi.fn(), register: vi.fn(), logout: vi.fn(), getUser: vi.fn(),
}))
vi.mock('../src/api/axios', () => ({ default: mocks }))
vi.mock('../src/api/auth', () => ({ authApi: mocks }))

import { useCacheStore } from '../src/stores/cache'
import { useAuthStore } from '../src/stores/auth'
import { proposalsApi } from '../src/api/proposals'
import { reviewsApi } from '../src/api/reviews'
import { tagsApi } from '../src/api/tags'

beforeEach(() => {
  setActivePinia(createPinia())
  for (const mock of Object.values(mocks)) mock.mockReset().mockResolvedValue({ data: { status: 'success' } })
})
afterEach(() => vi.useRealTimers())

describe('shared API cache', () => {
  it.each([
    ['speaker list', () => proposalsApi.getAll({ page: 2 })],
    ['review list', () => proposalsApi.getForReview()],
    ['admin list', () => proposalsApi.getAllForAdmin()],
    ['details', () => proposalsApi.getOne(1)],
    ['top rated', () => proposalsApi.getTopRated()],
    ['reviews', () => reviewsApi.getForProposal(1)],
    ['rating options', () => reviewsApi.getRatingOptions()],
    ['tags', () => tagsApi.getAll()],
  ])('caches successful %s responses', async (_name, get) => {
    const data = { status: 'success', data: { items: [] } }
    mocks.get.mockResolvedValue({ data })
    await get()
    expect(await get()).toEqual({ data })
    expect(mocks.get).toHaveBeenCalledOnce()
  })

  it('does not cache failed requests', async () => {
    mocks.get.mockRejectedValueOnce(new Error('offline'))
    await expect(proposalsApi.getAll()).rejects.toThrow('offline')
    await proposalsApi.getAll()
    expect(mocks.get).toHaveBeenCalledTimes(2)
  })

  it('expires at the exact TTL boundary and keeps getters read-only', () => {
    vi.useFakeTimers()
    const cache = useCacheStore()
    cache.set('test', false, 1000)
    expect(cache.get('test')).toBe(false)
    expect(cache.has('test')).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(cache.get('test')).toBeNull()
    expect(cache.has('test')).toBe(false)
    expect(cache.cache.has('test')).toBe(true)
    cache.clearExpired()
    expect(cache.cache.size).toBe(0)
  })

  it.each(['clear', 'invalidatePrefix', 'delete'])('does not refill after %s while a request is pending', async method => {
    let resolve
    mocks.get.mockImplementationOnce(() => new Promise(done => { resolve = done }))
    const request = proposalsApi.getAll()
    useCacheStore()[method]('proposals:all:{}')
    resolve({ data: { outdated: true } })
    await request
    expect(useCacheStore().has('proposals:all:{}')).toBe(false)
    await proposalsApi.getAll()
    expect(mocks.get).toHaveBeenCalledTimes(2)
  })

  it('removes expired entries when fresh data is cached', () => {
    vi.useFakeTimers()
    const cache = useCacheStore()
    cache.set('expired', {}, 1000)
    vi.advanceTimersByTime(1000)
    cache.set('fresh', {}, 1000)
    expect([...cache.cache.keys()]).toEqual(['fresh'])
  })

  it.each([
    ['create', () => proposalsApi.create({ title: 'Title', description: 'Description' })],
    ['update', () => proposalsApi.update(1, { title: 'Changed' })],
    ['delete', () => proposalsApi.delete(1)],
    ['status', () => proposalsApi.updateStatus(1, 'approved')],
  ])('invalidates all proposal views after %s', async (_name, mutate) => {
    const cache = useCacheStore()
    for (const key of ['proposals:one:1', 'proposals:all:{}', 'proposals:review:{}', 'proposals:admin:{}', 'proposals:top-rated:10']) {
      cache.set(key, { outdated: true })
    }
    cache.set('tags:all:{}', { valid: true })
    await mutate()
    expect([...cache.cache.keys()]).toEqual(['tags:all:{}'])
  })

  it.each([
    ['create', () => reviewsApi.create(1, { rating: 5 })],
    ['update', () => reviewsApi.update(1, 2, { rating: 10 })],
  ])('refreshes proposal ratings and matching review pages after review %s', async (_name, mutate) => {
    const cache = useCacheStore()
    for (const key of ['reviews:proposal:1:{}', 'reviews:proposal:1:{"page":2}', 'proposals:one:1', 'proposals:top-rated:10']) cache.set(key, {})
    cache.set('reviews:proposal:2:{}', {})
    await mutate()
    expect([...cache.cache.keys()]).toEqual(['reviews:proposal:2:{}'])
  })

  it('invalidates a pending list even when no old cache entry exists', async () => {
    let resolve
    mocks.get.mockImplementationOnce(() => new Promise(done => { resolve = done }))
    const pending = proposalsApi.getForReview()
    await proposalsApi.update(1, { title: 'Changed' })
    resolve({ data: { oldTitle: true } })
    await pending
    expect(useCacheStore().has('proposals:review:{}')).toBe(false)
  })

  it('preserves cache after a failed mutation', async () => {
    useCacheStore().set('proposals:one:1', { title: 'Existing' })
    mocks.post.mockRejectedValueOnce(new Error('validation'))
    await expect(proposalsApi.update(1, { title: '' })).rejects.toThrow('validation')
    expect(useCacheStore().get('proposals:one:1')).toEqual({ title: 'Existing' })
  })

  it('only invalidates tags when a tag is created', async () => {
    const cache = useCacheStore()
    cache.set('tags:all:{}', {})
    cache.set('proposals:one:1', {})
    await tagsApi.create('Laravel')
    expect([...cache.cache.keys()]).toEqual(['proposals:one:1'])
  })
})

describe('cache identity boundaries', () => {
  it.each(['login', 'register'])('clears another identity’s cache after %s', async action => {
    const auth = useAuthStore()
    auth.user = { id: 1, role: 'speaker' }
    useCacheStore().set('proposals:one:1', { private: true })
    mocks[action].mockResolvedValue({ data: { data: { user: { id: 2, role: 'reviewer' } } } })
    await auth[action]({})
    expect(useCacheStore().cache.size).toBe(0)
    expect(auth.user.id).toBe(2)
  })

  it('clears cache on logout even if the network request fails', async () => {
    const auth = useAuthStore()
    auth.user = { id: 1, role: 'speaker' }
    useCacheStore().set('proposals:one:1', {})
    mocks.logout.mockRejectedValueOnce(new Error('offline'))
    await expect(auth.logout()).rejects.toThrow('offline')
    expect(auth.user).toBeNull()
    expect(useCacheStore().cache.size).toBe(0)
  })

  it('preserves cache for an unchanged user and invalidates a role change', () => {
    const auth = useAuthStore()
    auth.setUser({ id: 1, role: 'speaker' })
    useCacheStore().set('proposals:one:1', {})
    auth.setUser({ id: 1, role: 'speaker', name: 'Updated' })
    expect(useCacheStore().cache.size).toBe(1)
    auth.setUser({ id: 1, role: 'reviewer' })
    expect(useCacheStore().cache.size).toBe(0)
  })

  it('clears private cache when user retrieval reports an expired session', async () => {
    const auth = useAuthStore()
    auth.user = { id: 1, role: 'speaker' }
    useCacheStore().set('proposals:one:1', {})
    mocks.getUser.mockRejectedValueOnce({ response: { status: 401 } })
    expect(await auth.fetchUser()).toBeNull()
    expect(useCacheStore().cache.size).toBe(0)
  })
})
