import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRealtimeSession } from '../src/composables/realtimeSession'

describe('createRealtimeSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cancels pending initialization when the user logs out', () => {
    const initialize = vi.fn()
    const disconnect = vi.fn()
    const session = createRealtimeSession({ initialize, disconnect })

    session.sync(1)
    session.sync(null)
    vi.runAllTimers()

    expect(initialize).not.toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalledTimes(2)
  })

  it('initializes only the latest account after an identity change', () => {
    const initialize = vi.fn()
    const disconnect = vi.fn()
    const session = createRealtimeSession({ initialize, disconnect })

    session.sync(1)
    vi.advanceTimersByTime(250)
    session.sync(2)
    vi.advanceTimersByTime(499)
    expect(initialize).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(initialize).toHaveBeenCalledOnce()
    expect(initialize).toHaveBeenCalledWith(2)
  })

  it('cancels pending work and disconnects on disposal', () => {
    const initialize = vi.fn()
    const disconnect = vi.fn()
    const session = createRealtimeSession({ initialize, disconnect })

    session.sync(1)
    session.dispose()
    vi.runAllTimers()

    expect(initialize).not.toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalledTimes(2)
  })
})
