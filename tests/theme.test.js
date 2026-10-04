import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '../src/stores/theme'

let storage
let classes

beforeEach(() => {
  vi.stubEnv('VITE_DEFAULT_THEME', 'light')
  setActivePinia(createPinia())
  storage = new Map()
  classes = new Set()
  vi.stubGlobal('localStorage', {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  })
  vi.stubGlobal('document', {
    documentElement: {
      classList: {
        add: name => classes.add(name),
        remove: name => classes.delete(name),
      },
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('theme preferences', () => {
  it('defaults to light mode without a saved preference', () => {
    classes.add('dark')
    expect(useThemeStore().isDark).toBe(false)
    expect(classes.has('dark')).toBe(false)
    expect(storage.get('theme')).toBe('light')
  })

  it.each([undefined, '', 'invalid', 'light', 'dark'])(
    'uses the environment default %s with a safe light fallback', defaultTheme => {
      vi.stubEnv('VITE_DEFAULT_THEME', defaultTheme)
      const expectedDark = defaultTheme === 'dark'
      expect(useThemeStore().isDark).toBe(expectedDark)
      expect(classes.has('dark')).toBe(expectedDark)
      expect(storage.get('theme')).toBe(expectedDark ? 'dark' : 'light')
    }
  )

  it.each([
    ['dark', 'light'],
    ['light', 'dark'],
  ])('prefers saved %s over the %s environment default', (saved, defaultTheme) => {
    vi.stubEnv('VITE_DEFAULT_THEME', defaultTheme)
    storage.set('theme', saved)
    expect(useThemeStore().isDark).toBe(saved === 'dark')
    expect(classes.has('dark')).toBe(saved === 'dark')
    expect(storage.get('theme')).toBe(saved)
  })

  it('uses the environment default for an invalid saved preference', () => {
    vi.stubEnv('VITE_DEFAULT_THEME', 'dark')
    storage.set('theme', 'invalid')
    expect(useThemeStore().isDark).toBe(true)
    expect(classes.has('dark')).toBe(true)
    expect(storage.get('theme')).toBe('dark')
  })

  it.each(['light', 'invalid'])('uses light mode for a %s preference', preference => {
    storage.set('theme', preference)
    expect(useThemeStore().isDark).toBe(false)
    expect(classes.has('dark')).toBe(false)
    expect(storage.get('theme')).toBe('light')
  })

  it('respects a saved dark preference', () => {
    storage.set('theme', 'dark')
    expect(useThemeStore().isDark).toBe(true)
    expect(classes.has('dark')).toBe(true)
    expect(storage.get('theme')).toBe('dark')
  })

  it('persists toggles and restores them when the store is recreated', () => {
    const theme = useThemeStore()
    theme.toggleTheme()
    expect(theme.isDark).toBe(true)
    expect(classes.has('dark')).toBe(true)
    expect(storage.get('theme')).toBe('dark')

    setActivePinia(createPinia())
    const restored = useThemeStore()
    expect(restored.isDark).toBe(true)
    restored.toggleTheme()
    expect(restored.isDark).toBe(false)
    expect(classes.has('dark')).toBe(false)
    expect(storage.get('theme')).toBe('light')
  })

  it('continues to support explicitly setting either theme', () => {
    const theme = useThemeStore()
    theme.setTheme(true)
    expect(theme.isDark).toBe(true)
    expect(classes.has('dark')).toBe(true)
    expect(storage.get('theme')).toBe('dark')
    theme.setTheme(false)
    expect(theme.isDark).toBe(false)
    expect(classes.has('dark')).toBe(false)
    expect(storage.get('theme')).toBe('light')
  })
})
