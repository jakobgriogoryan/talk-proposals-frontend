import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'
import { ssrRenderAttrs } from '@vue/server-renderer'

// Exercise the locked transitive packages at their reported vulnerable boundaries.
// The app is client-rendered; these checks do not imply an exposed SSR endpoint.
const require = createRequire(import.meta.url)
const { SourceMapConsumer } = require('source-map-js')

const basicMap = { version: 3, sources: ['input.js'], names: [], mappings: 'AAAA' }
const indexedMap = (line, map = basicMap) => ({
  version: 3,
  sections: [{ offset: { line, column: 0 }, map }],
})

describe('locked Vue attribute safety', () => {
  it.each(['x\rautofocus\ronfocus', 'x\r\nautofocus\r\nonfocus'])(
    'rejects whitespace-separated attribute names: %j',
    (key) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        expect(ssrRenderAttrs({ [key]: 'unsafe-handler' })).toBe('')
      } finally {
        warn.mockRestore()
        error.mockRestore()
      }
    },
  )

  it('preserves ordinary attributes and escapes their values', () => {
    expect(ssrRenderAttrs({ title: '<speaker>"', 'data-status': 'pending' }))
      .toBe(' title="&lt;speaker&gt;&quot;" data-status="pending"')
  })
})

describe('locked indexed source-map safety', () => {
  // Constructor rejection is sufficient: never serialize huge mappings or run
  // the vulnerable unbounded SourceNode loop to demonstrate a denial of service.
  it.each([Number.MAX_SAFE_INTEGER, 0.5, '2'])(
    'rejects excessive or invalid section line offsets: %j',
    (line) => {
      expect(() => new SourceMapConsumer(indexedMap(line))).toThrow(/Section offset line/)
    },
  )

  it('rejects nested offsets whose combined line exceeds the bound', () => {
    expect(() => new SourceMapConsumer(indexedMap(6_000_000, indexedMap(6_000_000))))
      .toThrow(/including offsets of nested sections/)
  })

  it('preserves ordinary indexed source mappings', () => {
    const consumer = new SourceMapConsumer(indexedMap(2))
    const mappings = []
    consumer.eachMapping((mapping) => mappings.push(mapping))
    expect(mappings).toHaveLength(1)
    expect(mappings[0]).toMatchObject({
      source: 'input.js', generatedLine: 3, generatedColumn: 0, originalLine: 1,
    })
  })
})
