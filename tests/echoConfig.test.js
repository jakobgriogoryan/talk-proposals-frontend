import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ echo: vi.fn(), post: vi.fn() }))
vi.mock('laravel-echo', () => ({ default: class { constructor(options) { mocks.echo(options) } } }))
vi.mock('pusher-js', () => ({ default: class Pusher {} }))
vi.mock('../src/api/axios', () => ({ default: { post: mocks.post } }))
beforeEach(() => { vi.resetModules(); vi.clearAllMocks() })
afterEach(() => { vi.unstubAllEnvs() })

it.each(['', '   ', undefined])('uses the native null broadcaster when no key is configured', async key => {
  vi.stubEnv('VITE_PUSHER_APP_KEY', key)
  await import('../src/config/echo')
  expect(mocks.echo).toHaveBeenCalledWith({ broadcaster: 'null' })
  expect(mocks.post).not.toHaveBeenCalled()
})
it('injects Pusher and uses the shared authenticated API client when configured', async () => {
  vi.stubEnv('VITE_PUSHER_APP_KEY', ' public-test-key ')
  vi.stubEnv('VITE_PUSHER_APP_CLUSTER', 'eu')
  await import('../src/config/echo')
  const options = mocks.echo.mock.calls[0][0]
  expect(options).toMatchObject({ broadcaster: 'pusher', key: 'public-test-key', cluster: 'eu' })
  expect(options.Pusher).toBeTypeOf('function')
  mocks.post.mockResolvedValue({ data: { auth: 'signature' } })
  const callback = vi.fn()
  options.authorizer({ name: 'private-proposals' }).authorize('123.456', callback)
  await vi.waitFor(() => expect(callback).toHaveBeenCalledWith(false, { auth: 'signature' }))
  expect(mocks.post).toHaveBeenCalledWith('/broadcasting/auth', { socket_id: '123.456', channel_name: 'private-proposals' })
})
it('reports rejected channel authorization to Echo', async () => {
  vi.stubEnv('VITE_PUSHER_APP_KEY', 'public-test-key')
  await import('../src/config/echo')
  const error = new Error('Forbidden'), callback = vi.fn()
  mocks.post.mockRejectedValue(error)
  mocks.echo.mock.calls[0][0].authorizer({ name: 'private-proposals' }).authorize('123.456', callback)
  await vi.waitFor(() => expect(callback).toHaveBeenCalledWith(true, error))
})
