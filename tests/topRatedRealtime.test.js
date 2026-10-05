import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred, find, node, renderer, settle, trigger } from './helpers/vue-renderer'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../src/api', () => ({ proposalsApi: { getTopRated: mocks.get } }))
vi.mock('vue-router', () => ({ useRouter: () => ({push: vi.fn()}) }))
import TopRatedSlider from '../src/components/TopRatedSlider.vue'

const apps = []
let listeners
beforeEach(() => {
  vi.useFakeTimers()
  mocks.get.mockReset()
  listeners = new Map()
  vi.stubGlobal('window', {
    innerWidth: 1200,
    addEventListener: vi.fn((event, callback) => listeners.set(event, callback)),
    removeEventListener: vi.fn((event, callback) => { if (listeners.get(event) === callback) listeners.delete(event) }),
  })
})
afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals()
})
const response = title => ({data: {data: {proposals: [{id: 1, title, description: '', tags: [], user: {}, average_rating: 4, reviews_count: 1}]}}})
const mount = () => {
  const root = node('root'), app = renderer.createApp(TopRatedSlider)
  app.mount(root); apps.push(app)
  return {root, app}
}

describe('top-rated realtime refresh', () => {
  it.each(['proposal-submitted', 'proposal-reviewed', 'proposal-status-changed'])('refreshes visible ratings after %s', async event => {
    mocks.get.mockResolvedValueOnce(response('Original')).mockResolvedValueOnce(response('Updated'))
    const {root} = mount()
    await settle()
    listeners.get(event)()
    await settle()
    expect(mocks.get).toHaveBeenCalledTimes(2)
    expect(find(root, el => el.text === 'Updated')).toBeDefined()
  })

  it('does not start an interval when a request resolves after unmount', async () => {
    const pending = deferred()
    mocks.get.mockReturnValue(pending.promise)
    const {app} = mount()
    app.unmount(); apps.splice(apps.indexOf(app), 1)
    pending.resolve(response('Late'))
    await settle()
    expect(vi.getTimerCount()).toBe(0)
    expect(listeners.size).toBe(0)
  })

  it('clears a delayed auto-slide restart on unmount', async () => {
    mocks.get.mockResolvedValue(response('Original'))
    const {root, app} = mount()
    await settle()
    trigger(find(root, el => el.type === 'button'), 'click')
    app.unmount(); apps.splice(apps.indexOf(app), 1)
    vi.advanceTimersByTime(5000)
    expect(vi.getTimerCount()).toBe(0)
    expect(listeners.size).toBe(0)
  })
})
