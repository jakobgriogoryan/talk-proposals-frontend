import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred } from './helpers/vue-renderer'

const web = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('axios', () => ({ default: { create: () => web } }))
vi.mock('../src/api/axios', () => ({ default: {} }))
import { getCsrfCookie } from '../src/api/auth'

beforeEach(() => vi.clearAllMocks())

describe('CSRF cookie preparation', () => {
  it('shares concurrent requests and fetches again after completion', async () => {
    const pending = deferred()
    web.get.mockReturnValueOnce(pending.promise).mockResolvedValueOnce({ status: 204 })
    const first = getCsrfCookie(), second = getCsrfCookie()
    expect(web.get).toHaveBeenCalledTimes(1)
    expect(web.get).toHaveBeenCalledWith('/sanctum/csrf-cookie')
    pending.resolve({ status: 204 })
    await Promise.all([first, second])
    await getCsrfCookie()
    expect(web.get).toHaveBeenCalledTimes(2)
  })

  it('propagates failures and allows a later attempt', async () => {
    web.get.mockRejectedValueOnce(new Error('Endpoint unavailable')).mockResolvedValueOnce({ status: 204 })
    await expect(getCsrfCookie()).rejects.toThrow('Endpoint unavailable')
    await expect(getCsrfCookie()).resolves.toMatchObject({ status: 204 })
    expect(web.get).toHaveBeenCalledTimes(2)
  })
})
