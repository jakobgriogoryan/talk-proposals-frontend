import { describe, expect, it } from 'vitest'
import { devServerConfig } from '../config/devServer'

describe('portable development server settings', () => {
  it('uses loopback defaults without a machine-specific allowed host', () => {
    const config = devServerConfig()
    expect(config.port).toBe(5173)
    expect(config.allowedHosts).toEqual([])
    expect(config.proxy['/api'].target).toBe('http://localhost:8000')
    expect(config.proxy['/sanctum'].target).toBe(config.proxy['/api'].target)
    expect(config.proxy['/api']).not.toHaveProperty('secure', false)
  })
  it('uses explicit local environment overrides', () => {
    const config = devServerConfig({ DEV_PORT: '5174', DEV_API_TARGET: 'https://api.example.test', DEV_ALLOWED_HOSTS: 'talkproposals.test, other.test, ' })
    expect(config.port).toBe(5174)
    expect(config.proxy['/api'].target).toBe('https://api.example.test')
    expect(config.allowedHosts).toEqual(['talkproposals.test', 'other.test'])
  })
  it.each(['0', '-1', '65536', '5173.5', 'invalid'])('rejects invalid port %s', port => {
    expect(() => devServerConfig({ DEV_PORT: port })).toThrow('DEV_PORT')
  })
  it.each(['not a URL', 'file:///tmp/api', 'http://user:secret@localhost:8000'])('rejects unsafe or malformed targets', target => {
    expect(() => devServerConfig({ DEV_API_TARGET: target })).toThrow('DEV_API_TARGET')
  })
})
