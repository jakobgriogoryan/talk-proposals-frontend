import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRealtimeSession } from '../src/composables/realtimeSession'

describe('createRealtimeSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes immediately and disconnects on logout without delayed work', () => {
    const initialize = vi.fn()
    const disconnect = vi.fn()
    const session = createRealtimeSession({ initialize, disconnect })

    session.sync(1)
    expect(initialize).toHaveBeenCalledOnce()
    expect(initialize).toHaveBeenCalledWith(1)
    session.sync(null)
    vi.runAllTimers()

    expect(initialize).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    expect(disconnect).toHaveBeenCalledTimes(2)
  })

  it('disconnects the old account before immediately initializing its replacement', () => {
    const initialize = vi.fn()
    const disconnect = vi.fn()
    const session = createRealtimeSession({ initialize, disconnect })

    session.sync(1)
    session.sync(2)
    expect(initialize.mock.calls).toEqual([[1], [2]])
    expect(disconnect.mock.invocationCallOrder[1]).toBeLessThan(initialize.mock.invocationCallOrder[1])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('disconnects on disposal without scheduling any later initialization', () => {
    const initialize = vi.fn()
    const disconnect = vi.fn()
    const session = createRealtimeSession({ initialize, disconnect })

    session.sync(1)
    session.dispose()
    vi.runAllTimers()

    expect(initialize).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    expect(disconnect).toHaveBeenCalledTimes(2)
  })
})
