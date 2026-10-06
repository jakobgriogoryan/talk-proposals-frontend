import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const echoMock = vi.hoisted(() => ({
  private: vi.fn(),
  leave: vi.fn(),
}))

vi.mock('../src/config/echo', () => ({ default: echoMock }))

import { REALTIME_EVENTS, useRealtime } from '../src/composables/useRealtime'
import { useAuthStore } from '../src/stores/auth'
import { useNotificationsStore } from '../src/stores/notifications'
import { useCacheStore } from '../src/stores/cache'

let createdChannels

const makeChannel = (name) => {
  const listeners = new Map()
  const channel = {
    name,
    listeners,
    listen: vi.fn((eventName, callback) => {
      listeners.set(eventName, callback)
      return channel
    }),
    stopListening: vi.fn(),
  }

  createdChannels.push(channel)
  return channel
}

const latestChannel = (name) => createdChannels.findLast((channel) => channel.name === name)
// Independent broadcast contract: six domain events and two lifecycle callbacks.
const expectedChannelEvents = [
  '.proposal.submitted', '.proposal.reviewed', '.proposal.status.changed',
  '.proposal.updated', '.proposal.deleted', '.review.updated',
  '.pusher:subscription_succeeded', '.pusher:subscription_error',
].sort()

describe('useRealtime', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('window', { dispatchEvent: vi.fn() })
    createdChannels = []
    echoMock.private.mockReset()
    echoMock.leave.mockReset()
    echoMock.private.mockImplementation(makeChannel)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('keeps speakers off the reviewer-wide channel', () => {
    useAuthStore().user = { id: 11, role: 'speaker' }

    useRealtime().initialize()

    expect(echoMock.private).toHaveBeenCalledTimes(1)
    expect(echoMock.private).toHaveBeenCalledWith('user.11')
    expect(echoMock.private).not.toHaveBeenCalledWith('proposals')
  })

  it.each(Object.values(REALTIME_EVENTS))('invalidates cached proposals before dispatching %s', eventName => {
    vi.useFakeTimers()
    useAuthStore().user = { id: 22, role: 'reviewer' }
    const cache = useCacheStore()
    for (const key of ['proposals:review:{}', 'proposals:one:7', 'proposals:top-rated:12', 'reviews:proposal:7:{}']) cache.set(key, { stale: true })
    cache.set('reviews:proposal:8:{}', { valid: true })
    window.dispatchEvent.mockImplementation(() => {
      expect(cache.has('proposals:review:{}')).toBe(false)
      expect(cache.has('proposals:one:7')).toBe(false)
      expect(cache.has('proposals:top-rated:12')).toBe(false)
      expect(cache.has('reviews:proposal:7:{}')).toBe(false)
    })
    const realtime = useRealtime()
    realtime.initialize()
    latestChannel('proposals').listeners.get(eventName)({
      proposal: {id: 7, title: 'Updated'}, review: {id: 1, rating: 5}, new_status: 'approved', message: 'Updated',
    })
    expect(window.dispatchEvent).toHaveBeenCalledOnce()
    expect(cache.has('reviews:proposal:8:{}')).toBe(true)
    realtime.disconnect()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it.each(['reviewer', 'admin'])('uses the canonical event names on %s and user channels', role => {
    useAuthStore().user = { id: 22, role }

    useRealtime().initialize()

    expect(Array.from(latestChannel('proposals').listeners.keys()).sort()).toEqual(expectedChannelEvents)
    expect(Array.from(latestChannel('user.22').listeners.keys()).sort()).toEqual(expectedChannelEvents)
    expect(REALTIME_EVENTS).toEqual({
      submitted: '.proposal.submitted', reviewed: '.proposal.reviewed',
      statusChanged: '.proposal.status.changed', updated: '.proposal.updated',
      deleted: '.proposal.deleted', reviewUpdated: '.review.updated',
    })
  })

  it('removes exact callbacks and leaves old channels before reinitializing', () => {
    useAuthStore().user = { id: 33, role: 'reviewer' }
    const realtime = useRealtime()

    realtime.initialize()
    const firstSharedChannel = latestChannel('proposals')
    const firstUserChannel = latestChannel('user.33')

    realtime.initialize()

    expect(firstSharedChannel.stopListening).toHaveBeenCalledTimes(expectedChannelEvents.length)
    expect(firstUserChannel.stopListening).toHaveBeenCalledTimes(expectedChannelEvents.length)
    firstSharedChannel.listeners.forEach((callback, eventName) => {
      expect(firstSharedChannel.stopListening).toHaveBeenCalledWith(eventName, callback)
    })
    firstUserChannel.listeners.forEach((callback, eventName) => {
      expect(firstUserChannel.stopListening).toHaveBeenCalledWith(eventName, callback)
    })
    expect(echoMock.leave).toHaveBeenCalledWith('proposals')
    expect(echoMock.leave).toHaveBeenCalledWith('user.33')
    expect(echoMock.private).toHaveBeenCalledTimes(4)
  })

  it.each([
    ['.proposal.updated', 'proposal-updated'],
    ['.proposal.deleted', 'proposal-deleted'],
    ['.review.updated', 'review-updated'],
  ])('ignores stale %s callbacks while handling the current subscription', (eventName, dispatchedName) => {
    useAuthStore().user = { id: 33, role: 'reviewer' }
    const cache = useCacheStore()
    const push = vi.spyOn(useNotificationsStore(), 'push')
    const realtime = useRealtime()
    realtime.initialize()
    const stale = latestChannel('proposals').listeners.get(eventName)
    realtime.initialize()
    const current = latestChannel('proposals').listeners.get(eventName)
    const payload = { event_id: 'changed-7', proposal_id: 7 }
    cache.set('proposals:one:7', { stale: true })

    stale(payload)
    expect(cache.has('proposals:one:7')).toBe(true)
    expect(window.dispatchEvent).not.toHaveBeenCalled()
    current(payload)
    expect(cache.has('proposals:one:7')).toBe(false)
    expect(window.dispatchEvent).toHaveBeenCalledOnce()
    expect(window.dispatchEvent.mock.calls[0][0]).toMatchObject({ type: dispatchedName, detail: payload })
    expect(push).not.toHaveBeenCalled()

    realtime.disconnect()
    cache.set('proposals:one:7', { stale: true })
    current(payload)
    expect(cache.has('proposals:one:7')).toBe(true)
    expect(window.dispatchEvent).toHaveBeenCalledOnce()
  })

  it('returns scoped cleanup for a proposal channel', () => {
    useAuthStore().user = { id: 44, role: 'speaker' }
    const onReviewed = vi.fn()
    const onStatusChanged = vi.fn()

    const stop = useRealtime().listenToProposal(91, { onReviewed, onStatusChanged })
    const channel = latestChannel('proposals.91')

    const reviewedListener = channel.listeners.get(REALTIME_EVENTS.reviewed)
    const statusListener = channel.listeners.get(REALTIME_EVENTS.statusChanged)
    const cache = useCacheStore()
    cache.set('proposals:one:91', {})
    cache.set('reviews:proposal:91:{}', {})
    const payload = { proposal_id: 91 }
    onReviewed.mockImplementation(() => {
      expect(cache.has('proposals:one:91')).toBe(false)
      expect(cache.has('reviews:proposal:91:{}')).toBe(false)
    })
    reviewedListener(payload)
    statusListener(payload)
    expect(onReviewed).toHaveBeenCalledWith(payload)
    expect(onStatusChanged).toHaveBeenCalledWith(payload)

    stop()

    expect(channel.stopListening).toHaveBeenCalledWith(REALTIME_EVENTS.reviewed, reviewedListener)
    expect(channel.stopListening).toHaveBeenCalledWith(REALTIME_EVENTS.statusChanged, statusListener)
    expect(echoMock.leave).toHaveBeenCalledWith('proposals.91')
  })

  it('deduplicates notifications delivered through overlapping channels', () => {
    vi.useFakeTimers()
    const authStore = useAuthStore()
    authStore.user = { id: 55, role: 'reviewer' }
    const notificationsStore = useNotificationsStore()
    const push = vi.spyOn(notificationsStore, 'push')
    const realtime = useRealtime()
    const payload = {
      event_id: 'status-event-1',
      proposal_id: 7,
      proposal: { id: 7, title: 'A safer proposal' },
      new_status: 'approved',
      message: 'Status changed',
    }

    realtime.initialize()
    latestChannel('proposals').listeners.get(REALTIME_EVENTS.statusChanged)(payload)
    latestChannel('user.55').listeners.get(REALTIME_EVENTS.statusChanged)(payload)

    expect(push).toHaveBeenCalledTimes(1)

    realtime.disconnect()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('delivers genuine repeated status changes without waiting five seconds', () => {
    vi.useFakeTimers()
    useAuthStore().user = { id: 55, role: 'reviewer' }
    useRealtime().initialize()
    const listener = latestChannel('proposals').listeners.get(REALTIME_EVENTS.statusChanged)
    ;['approved', 'rejected', 'approved'].forEach((status, index) => {
      listener({ event_id: `change-${index}`, proposal_id: 7, new_status: status, message: status })
    })
    expect(window.dispatchEvent.mock.calls.map(([event]) => event.detail.new_status))
      .toEqual(['approved', 'rejected', 'approved'])
  })

  it('does not suppress legacy events whose identity cannot be proven', () => {
    vi.useFakeTimers()
    useAuthStore().user = { id: 55, role: 'reviewer' }
    useRealtime().initialize()
    const listener = latestChannel('proposals').listeners.get(REALTIME_EVENTS.statusChanged)
    const payload = { proposal_id: 7, new_status: 'approved', message: 'Changed' }
    listener(payload)
    listener(payload)
    expect(window.dispatchEvent).toHaveBeenCalledTimes(2)
  })

  it('resynchronizes stale caches on initial subscription and reconnection without a toast', () => {
    useAuthStore().user = { id: 55, role: 'reviewer' }
    const cache = useCacheStore()
    const push = vi.spyOn(useNotificationsStore(), 'push')
    const realtime = useRealtime()
    realtime.initialize()
    const ready = latestChannel('proposals').listeners.get('.pusher:subscription_succeeded')
    for (let reconnect = 0; reconnect < 2; reconnect++) {
      cache.set('proposals:one:7', { stale: true })
      cache.set('reviews:proposal:7:{}', { stale: true })
      ready()
      expect(cache.has('proposals:one:7')).toBe(false)
      expect(cache.has('reviews:proposal:7:{}')).toBe(false)
    }
    expect(window.dispatchEvent.mock.calls.map(([event]) => event.type))
      .toEqual(['realtime-resynced', 'realtime-resynced'])
    expect(push).not.toHaveBeenCalled()
  })

  it('ignores late lifecycle callbacks after logout or subscription replacement', () => {
    const auth = useAuthStore()
    auth.user = { id: 55, role: 'reviewer' }
    const push = vi.spyOn(useNotificationsStore(), 'push')
    const realtime = useRealtime()
    realtime.initialize()
    const old = latestChannel('proposals')
    realtime.initialize()
    old.listeners.get('.pusher:subscription_succeeded')()
    old.listeners.get('.pusher:subscription_error')()
    const current = latestChannel('proposals')
    auth.user = null
    current.listeners.get('.pusher:subscription_succeeded')()
    current.listeners.get('.pusher:subscription_error')()
    expect(window.dispatchEvent).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    realtime.disconnect()
  })

  it('reports subscription failure once until a successful resubscription', () => {
    useAuthStore().user = { id: 55, role: 'speaker' }
    const push = vi.spyOn(useNotificationsStore(), 'push')
    useRealtime().initialize()
    const channel = latestChannel('user.55')
    const error = channel.listeners.get('.pusher:subscription_error')
    error(); error()
    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenLastCalledWith(expect.stringContaining('Live updates'), 'warning', 8000)
    channel.listeners.get('.pusher:subscription_succeeded')()
    error()
    expect(push).toHaveBeenCalledTimes(2)
  })

  it('invalidates detail caches before scoped resynchronization and cleans lifecycle callbacks', () => {
    useAuthStore().user = { id: 55, role: 'speaker' }
    const cache = useCacheStore()
    const onResynced = vi.fn(() => expect(cache.has('proposals:one:7')).toBe(false))
    const stop = useRealtime().listenToProposal(7, { onResynced })
    const channel = latestChannel('proposals.7')
    cache.set('proposals:one:7', { stale: true })
    channel.listeners.get('.pusher:subscription_succeeded')()
    expect(onResynced).toHaveBeenCalledOnce()
    stop()
    channel.listeners.get('.pusher:subscription_succeeded')()
    expect(onResynced).toHaveBeenCalledOnce()
    expect(channel.stopListening).toHaveBeenCalledWith('.pusher:subscription_succeeded', expect.any(Function))
    expect(channel.stopListening).toHaveBeenCalledWith('.pusher:subscription_error', expect.any(Function))
  })

  it('deduplicates delayed overlapping delivery and expires bounded event identities', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    useAuthStore().user = { id: 55, role: 'reviewer' }
    useRealtime().initialize()
    const shared = latestChannel('proposals').listeners.get(REALTIME_EVENTS.statusChanged)
    const own = latestChannel('user.55').listeners.get(REALTIME_EVENTS.statusChanged)
    const payload = { event_id: 'same', new_status: 'approved', message: 'Changed' }
    shared(payload)
    vi.advanceTimersByTime(10_000)
    own(payload)
    expect(window.dispatchEvent).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(60_000)
    shared(payload)
    expect(window.dispatchEvent).toHaveBeenCalledTimes(2)
  })
})
