import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), logout: vi.fn() }))
vi.mock('../src/api/auth', () => ({ authApi: mocks }))
import { useAuthStore } from '../src/stores/auth'
import { authGuard } from '../src/router/authGuard'

function deferred() {
  let resolve, reject
  const promise = new Promise((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

beforeEach(() => {
  setActivePinia(createPinia())
  mocks.getUser.mockReset()
  mocks.logout.mockReset().mockResolvedValue({ data: {} })
})
afterEach(() => vi.useRealTimers())

describe('authentication initialization', () => {
  it('shares concurrent successful checks without scheduling polling timers', async () => {
    vi.useFakeTimers()
    const pending = deferred()
    mocks.getUser.mockReturnValue(pending.promise)
    const auth = useAuthStore()
    const requests = [auth.fetchUser(), auth.fetchUser()]
    expect(mocks.getUser).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    pending.resolve({ status: 200, data: { user: { id: 1, role: 'speaker' } } })
    expect(await Promise.all(requests)).toEqual([{ id: 1, role: 'speaker' }, { id: 1, role: 'speaker' }])
    expect(auth.initializing).toBe(false)
  })

  it('allows a fresh request after a failed check', async () => {
    mocks.getUser.mockRejectedValueOnce(new Error('offline'))
    const auth = useAuthStore()
    await expect(auth.fetchUser()).rejects.toThrow('offline')
    mocks.getUser.mockResolvedValueOnce({ status: 200, data: { user: { id: 1, role: 'speaker' } } })
    expect(await auth.fetchUser()).toEqual({ id: 1, role: 'speaker' })
    expect(mocks.getUser).toHaveBeenCalledTimes(2)
  })

  it('does not share a request between independent Pinia stores', async () => {
    const first = deferred()
    const second = deferred()
    mocks.getUser.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const firstAuth = useAuthStore()
    const firstRequest = firstAuth.fetchUser()
    setActivePinia(createPinia())
    const secondAuth = useAuthStore()
    const secondRequest = secondAuth.fetchUser()
    first.resolve({ status: 200, data: { user: { id: 1, role: 'speaker' } } })
    second.resolve({ status: 200, data: { user: { id: 2, role: 'reviewer' } } })
    await Promise.all([firstRequest, secondRequest])
    expect(firstAuth.user.id).toBe(1)
    expect(secondAuth.user.id).toBe(2)
    expect(mocks.getUser).toHaveBeenCalledTimes(2)
  })

  it('shares concurrent failures rather than resolving later callers as unauthenticated', async () => {
    vi.useFakeTimers()
    const pending = deferred()
    mocks.getUser.mockReturnValue(pending.promise)
    const auth = useAuthStore()
    const results = Promise.allSettled([auth.fetchUser(), auth.fetchUser()])
    pending.reject(new Error('offline'))
    await vi.runAllTimersAsync()
    expect((await results).map(result => result.status)).toEqual(['rejected', 'rejected'])
    expect(mocks.getUser).toHaveBeenCalledOnce()
    expect(auth.initializing).toBe(false)
  })

  it('does not restore a logged-out user from an earlier request', async () => {
    const pending = deferred()
    mocks.getUser.mockReturnValue(pending.promise)
    const auth = useAuthStore()
    auth.setUser({ id: 1, role: 'speaker' })
    const request = auth.fetchUser()
    await auth.logout()
    pending.resolve({ status: 200, data: { user: { id: 1, role: 'speaker' } } })
    expect(await request).toBeNull()
    expect(auth.user).toBeNull()
  })

  it('does not replace a newly authenticated identity with an older user check', async () => {
    const pending = deferred()
    mocks.getUser.mockReturnValue(pending.promise)
    const auth = useAuthStore()
    const request = auth.fetchUser()
    auth.setUser({ id: 2, role: 'reviewer' })
    pending.resolve({ status: 200, data: { user: { id: 1, role: 'speaker' } } })
    expect(await request).toEqual({ id: 2, role: 'reviewer' })
    expect(auth.user.id).toBe(2)
  })

  it('does not clear a newer identity when an old request receives 401', async () => {
    const pending = deferred()
    mocks.getUser.mockReturnValue(pending.promise)
    const auth = useAuthStore()
    const request = auth.fetchUser()
    auth.setUser({ id: 2, role: 'reviewer' })
    pending.reject({ response: { status: 401 } })
    expect(await request).toEqual({ id: 2, role: 'reviewer' })
  })
})

describe('authentication navigation guard', () => {
  const protectedRoute = { name: 'Proposals', fullPath: '/proposals', meta: { requiresAuth: true, roles: ['speaker', 'admin'] } }

  it('waits for a slow shared initialization instead of redirecting after a timer limit', async () => {
    vi.useFakeTimers()
    const pending = deferred()
    mocks.getUser.mockReturnValue(pending.promise)
    const auth = useAuthStore()
    const initialization = auth.fetchUser()
    let settled = false
    const navigation = authGuard(protectedRoute, {}).then(result => { settled = true; return result })
    await vi.advanceTimersByTimeAsync(3000)
    expect(settled).toBe(false)
    expect(mocks.getUser).toHaveBeenCalledOnce()
    pending.resolve({ status: 200, data: { user: { id: 1, role: 'speaker' } } })
    await initialization
    expect(await navigation).toBe(true)
  })

  it('does not fetch an anonymous user for a guest-only route', async () => {
    expect(await authGuard({ meta: { guest: true } }, {})).toBe(true)
    expect(mocks.getUser).not.toHaveBeenCalled()
  })

  it.each([
    ['speaker', 'Proposals'], ['reviewer', 'ReviewProposals'], ['admin', 'AdminProposals'],
  ])('redirects an authenticated %s away from guest routes', async (role, name) => {
    useAuthStore().setUser({ id: 1, role })
    expect(await authGuard({ meta: { guest: true } }, {})).toEqual({ name })
  })

  it('denies reviewers access to speaker creation routes', async () => {
    useAuthStore().setUser({ id: 1, role: 'reviewer' })
    expect(await authGuard(protectedRoute, {})).toEqual({ name: 'ReviewProposals' })
  })

  it('does not grant access for unrecognized roles', async () => {
    useAuthStore().setUser({ id: 1, role: 'speaker' })
    const route = { ...protectedRoute, meta: { requiresAuth: true, roles: ['toString'] } }
    expect(await authGuard(route, {})).toEqual({ name: 'Proposals' })
  })

  it.each(['speaker', 'admin'])('allows the %s role on speaker routes', async role => {
    useAuthStore().setUser({ id: 1, role })
    expect(await authGuard(protectedRoute, {})).toBe(true)
  })

  it('denies access after a failed initialization and preserves the redirect target', async () => {
    mocks.getUser.mockRejectedValueOnce(new Error('offline'))
    expect(await authGuard(protectedRoute, { name: 'Register' })).toEqual({ name: 'Login', query: { redirect: '/proposals' } })
  })

  it('does not add a redirect query on a page refresh', async () => {
    mocks.getUser.mockResolvedValueOnce({ status: 401, data: null })
    expect(await authGuard(protectedRoute, {})).toEqual({ name: 'Login', query: {} })
  })
})
