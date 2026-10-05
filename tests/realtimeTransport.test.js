import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const transport = vi.hoisted(() => ({ channels: new Map(), connectionListeners: new Map(), echo: null }))
vi.mock('../src/config/echo', async () => {
  const { default: Echo } = await import('laravel-echo')
  const client = {
    connection: {
      bind: (name, callback) => transport.connectionListeners.set(name, callback),
      unbind: (name, callback) => {
        if (transport.connectionListeners.get(name) === callback) transport.connectionListeners.delete(name)
      },
    },
    subscribe: name => {
      const listeners = new Map()
      const channel = {
        bind: (name, callback) => listeners.set(name, callback),
        unbind: (name, callback) => {
          if (listeners.get(name) === callback) listeners.delete(name)
        },
        listeners,
      }
      transport.channels.set(name, channel)
      return channel
    },
    unsubscribe: name => transport.channels.delete(name),
  }
  transport.echo = new Echo({ broadcaster: 'pusher', client, withoutInterceptors: true })
  return { default: transport.echo }
})

import { useRealtime } from '../src/composables/useRealtime'
import { useAuthStore } from '../src/stores/auth'
import { useNotificationsStore } from '../src/stores/notifications'

let realtime
beforeEach(() => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
  useAuthStore().user = { id: 7, role: 'speaker' }
  vi.stubGlobal('window', { dispatchEvent: vi.fn() })
  realtime = useRealtime()
  realtime.initialize()
})
afterEach(() => { realtime.disconnect(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals() })

it('binds and cleans actual Echo/Pusher lifecycle event names', () => {
  const channel = transport.channels.get('private-user.7')
  expect([...channel.listeners.keys()]).toContain('pusher:subscription_succeeded')
  expect([...channel.listeners.keys()]).toContain('pusher:subscription_error')
  expect([...channel.listeners.keys()]).toContain('proposal.status.changed')
  channel.listeners.get('pusher:subscription_succeeded')()
  expect(window.dispatchEvent.mock.calls[0][0].type).toBe('realtime-resynced')
  const lateCallback = channel.listeners.get('pusher:subscription_succeeded')
  const lateConnectionCallback = transport.connectionListeners.get('state_change')
  const push = vi.spyOn(useNotificationsStore(), 'push')
  realtime.disconnect()
  expect(channel.listeners.size).toBe(0)
  expect(transport.channels.size).toBe(0)
  expect(transport.connectionListeners.size).toBe(0)
  lateCallback()
  lateConnectionCallback({ current: 'failed' })
  expect(push).not.toHaveBeenCalled()
  expect(window.dispatchEvent).toHaveBeenCalledOnce()
})

it('reports a failed connection once and resynchronizes after reconnect', () => {
  const push = vi.spyOn(useNotificationsStore(), 'push')
  const state = transport.connectionListeners.get('state_change')
  state({ current: 'unavailable' }); state({ current: 'failed' })
  expect(push).toHaveBeenCalledOnce()
  state({ current: 'connected' })
  transport.channels.get('private-user.7').listeners.get('pusher:subscription_succeeded')()
  expect(window.dispatchEvent.mock.calls[0][0].type).toBe('realtime-resynced')
  state({ current: 'failed' })
  expect(push).toHaveBeenCalledTimes(2)
})
