import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotificationsStore } from '../src/stores/notifications'

let store
beforeEach(() => { vi.useFakeTimers(); setActivePinia(createPinia()); store = useNotificationsStore() })
afterEach(() => { store.$dispose(); vi.useRealTimers() })

it('expires notifications and keeps permanent notifications', () => {
  store.push('Temporary', 'success', 100)
  store.push('Permanent', 'error', 0)
  expect(store.all).toHaveLength(2)
  vi.advanceTimersByTime(100)
  expect(store.all.map(item => item.message)).toEqual(['Permanent'])
})
it('cancels timers on removal and clear', () => {
  const id = store.push('Remove me')
  store.push('Clear me')
  store.remove(id)
  expect(vi.getTimerCount()).toBe(1)
  store.clear()
  expect(store.all).toEqual([])
  expect(vi.getTimerCount()).toBe(0)
})
it('cancels timers when its Pinia scope is disposed', () => {
  store.push('Pending')
  store.$dispose()
  expect(vi.getTimerCount()).toBe(0)
})
it('does not reuse identifiers after clear', () => {
  const previous = store.push('Previous', 'info', 0)
  store.clear()
  expect(store.push('Next', 'info', 0)).not.toBe(previous)
})
