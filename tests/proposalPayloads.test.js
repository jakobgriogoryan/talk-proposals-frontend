import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('../src/api/axios', () => ({ default: { post: mocks.post } }))
import { proposalsApi } from '../src/api/proposals'

beforeEach(() => {
  setActivePinia(createPinia())
  mocks.post.mockReset().mockResolvedValue({ data: { status: 'success' } })
})

describe('proposal multipart payloads', () => {
  it('omits an optional attachment rather than sending the string null', async () => {
    await proposalsApi.create({ title: 'Title', description: 'Description', file: null, tags: [] })
    expect(mocks.post.mock.calls[0][1].has('file')).toBe(false)
  })

  it('supports creating a proposal without an optional tags property', async () => {
    await proposalsApi.create({ title: 'Title', description: 'Description' })
    expect(mocks.post).toHaveBeenCalledOnce()
  })

  it('explicitly transmits an empty tag list when removing the last tag', async () => {
    await proposalsApi.update(1, { tags: [] })
    const form = mocks.post.mock.calls[0][1]
    expect(form.get('tags')).toBe('[]')
    expect(form.get('_method')).toBe('PUT')
  })

  it('leaves tags untouched when the update does not include them', async () => {
    await proposalsApi.update(1, { title: 'Changed title' })
    expect(mocks.post.mock.calls[0][1].has('tags')).toBe(false)
  })
})
