import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'

const mocks = vi.hoisted(() => ({ csrf: vi.fn(), push: vi.fn(), setUser: vi.fn() }))
vi.mock('../src/api/auth', () => ({ getCsrfCookie: mocks.csrf }))
vi.mock('../src/stores/notifications', () => ({ useNotificationsStore: () => ({ push: mocks.push }) }))
vi.mock('../src/stores/auth', () => ({ useAuthStore: () => ({ user: null, setUser: mocks.setUser }) }))
import api from '../src/api/axios'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.csrf.mockResolvedValue()
})

const mismatch = config => new AxiosError('CSRF mismatch', 'ERR_BAD_REQUEST', config, null, {
  config, status: 419, data: { message: 'CSRF token mismatch.' }, headers: {},
})

describe('CSRF recovery', () => {
  it('clears identity through the auth action on an unexpected 401', async () => {
    vi.stubGlobal('window', { location: { pathname: '/login' } })
    api.defaults.adapter = async config => {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
        config, status: 401, data: {}, headers: {},
      })
    }
    try {
      await expect(api.get('/proposals')).rejects.toMatchObject({ response: { status: 401 } })
      expect(mocks.setUser).toHaveBeenCalledWith(null)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('retries a rejected mutation only once and emits one terminal error', async () => {
    let requests = 0
    api.defaults.adapter = async config => {
      if (++requests <= 2) throw mismatch(config)
      return { config, status: 200, data: {}, headers: {} }
    }
    await expect(api.post('/login', {})).rejects.toMatchObject({ response: { status: 419 } })
    expect(requests).toBe(2)
    expect(mocks.push).toHaveBeenCalledTimes(1)
  })

  it('does not show an error toast when a single retry succeeds', async () => {
    let requests = 0
    api.defaults.adapter = async config => {
      if (++requests === 1) throw mismatch(config)
      return { config, status: 200, data: {}, headers: {} }
    }
    await expect(api.post('/login', {})).resolves.toMatchObject({ status: 200 })
    expect(requests).toBe(2)
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('does not send a mutation if initial CSRF preparation fails', async () => {
    mocks.csrf.mockRejectedValue(new Error('CSRF endpoint unavailable'))
    const adapter = vi.fn().mockResolvedValue({ status: 200, data: {}, headers: {} })
    api.defaults.adapter = adapter
    await expect(api.post('/login', {})).rejects.toThrow('CSRF endpoint unavailable')
    expect(adapter).not.toHaveBeenCalled()
  })

  it('stops with one notification when CSRF refresh fails after a 419', async () => {
    mocks.csrf.mockResolvedValueOnce().mockRejectedValueOnce(new Error('Refresh unavailable'))
    const adapter = vi.fn(async config => { throw mismatch(config) })
    api.defaults.adapter = adapter
    await expect(api.post('/login', {})).rejects.toMatchObject({ response: { status: 419 } })
    expect(adapter).toHaveBeenCalledTimes(1)
    expect(mocks.csrf).toHaveBeenCalledTimes(2)
    expect(mocks.push).toHaveBeenCalledTimes(1)
  })
})
