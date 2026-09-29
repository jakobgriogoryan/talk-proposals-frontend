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
    vi.unstubAllGlobals()
  })

  it('keeps speakers off the reviewer-wide channel', () => {
    useAuthStore().user = { id: 11, role: 'speaker' }

    useRealtime().initialize()

    expect(echoMock.private).toHaveBeenCalledTimes(1)
    expect(echoMock.private).toHaveBeenCalledWith('user.11')
    expect(echoMock.private).not.toHaveBeenCalledWith('proposals')
  })

  it('uses the canonical event names on reviewer and user channels', () => {
    useAuthStore().user = { id: 22, role: 'reviewer' }

    useRealtime().initialize()

    expect(Array.from(latestChannel('proposals').listeners.keys())).toEqual([
      REALTIME_EVENTS.submitted,
      REALTIME_EVENTS.reviewed,
      REALTIME_EVENTS.statusChanged,
    ])
    expect(Array.from(latestChannel('user.22').listeners.keys())).toEqual([
      REALTIME_EVENTS.submitted,
      REALTIME_EVENTS.reviewed,
      REALTIME_EVENTS.statusChanged,
    ])
    expect(REALTIME_EVENTS.statusChanged).toBe('.proposal.status.changed')
  })

  it('removes exact callbacks and leaves old channels before reinitializing', () => {
    useAuthStore().user = { id: 33, role: 'reviewer' }
    const realtime = useRealtime()

    realtime.initialize()
    const firstSharedChannel = latestChannel('proposals')
    const firstUserChannel = latestChannel('user.33')

    realtime.initialize()

    expect(firstSharedChannel.stopListening).toHaveBeenCalledTimes(3)
    expect(firstUserChannel.stopListening).toHaveBeenCalledTimes(3)
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

  it('returns scoped cleanup for a proposal channel', () => {
    useAuthStore().user = { id: 44, role: 'speaker' }
    const onReviewed = vi.fn()
    const onStatusChanged = vi.fn()

    const stop = useRealtime().listenToProposal(91, { onReviewed, onStatusChanged })
    const channel = latestChannel('proposals.91')

    expect(channel.listeners.get(REALTIME_EVENTS.reviewed)).toBe(onReviewed)
    expect(channel.listeners.get(REALTIME_EVENTS.statusChanged)).toBe(onStatusChanged)

    stop()

    expect(channel.stopListening).toHaveBeenCalledWith(REALTIME_EVENTS.reviewed, onReviewed)
    expect(channel.stopListening).toHaveBeenCalledWith(REALTIME_EVENTS.statusChanged, onStatusChanged)
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
})
