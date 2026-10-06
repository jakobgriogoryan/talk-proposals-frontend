import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { h } from 'vue'
import { deferred, find, node, renderer, settle, trigger } from './helpers/vue-renderer'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../src/api/axios', () => ({ default: { get: mocks.get } }))
import ProposalForm from '../src/components/ProposalForm.vue'
import { downloadProposalFile, proposalDownloadError } from '../src/utils/proposalDownload'

const apps = []
let link
beforeEach(() => {
  setActivePinia(createPinia())
  mocks.get.mockReset().mockImplementation(url => Promise.resolve({ data: url === '/tags'
    ? { data: { tags: [] } } : new Blob(['%PDF-1.4 sample'], { type: 'application/pdf' }) }))
  link = { setAttribute: vi.fn(), click: vi.fn(), remove: vi.fn() }
  vi.stubGlobal('window', { URL: { createObjectURL: vi.fn(() => 'blob:pdf'), revokeObjectURL: vi.fn() } })
  vi.stubGlobal('document', { activeElement: null, createElement: vi.fn(() => link), body: { appendChild: vi.fn() } })
})
afterEach(() => { apps.splice(0).forEach(app => app.unmount()); vi.unstubAllGlobals() })

const mountForm = () => {
  const root = node('root')
  const app = renderer.createApp({ render: () => h(ProposalForm, {
    proposal: {id: 7, title: 'My Proposal', description: 'Description', tags: [], file_path: '/proposals/7/download'},
  }) })
  app.component('RouterLink', {
    props: ['to'],
    setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()),
  })
  app.mount(root); apps.push(app)
  return root
}

describe('authenticated proposal PDF downloads', () => {
  it('downloads the current attachment through the API, not the resource URL', async () => {
    const root = mountForm()
    trigger(find(root, el => el.type === 'button' && el.text === 'Download PDF'), 'click')
    await settle()
    expect(mocks.get).toHaveBeenCalledWith('/proposals/7/download', {responseType: 'blob'})
    expect(find(root, el => el.type === 'a' && el.props.href === '/proposals/7/download')).toBeUndefined()
    expect(link.href).toBe('blob:pdf')
    expect(link.setAttribute).toHaveBeenCalledWith('download', 'my_proposal.pdf')
    expect(link.click).toHaveBeenCalledOnce()
    expect(link.remove).toHaveBeenCalledOnce()
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:pdf')
  })

  it('prevents duplicate clicks and restores the button after a failure', async () => {
    const pending = deferred()
    const root = mountForm()
    mocks.get.mockReturnValueOnce(pending.promise)
    const button = find(root, el => el.type === 'button' && el.text === 'Download PDF')
    trigger(button, 'click'); trigger(button, 'click')
    await settle()
    expect(button.props.disabled).toBe(true)
    expect(mocks.get.mock.calls.filter(([url]) => url === '/proposals/7/download')).toHaveLength(1)
    pending.reject({response: {status: 404}})
    await settle()
    expect(button.props.disabled).toBe(false)
    expect(find(root, el => el.props.role === 'alert').text).toContain('could not be found')
  })

  it('does not download JSON errors returned as successful blobs', async () => {
    mocks.get.mockResolvedValue({status: 200, data: new Blob(['{"message":"Attachment unavailable"}'], {type: 'application/json'})})
    await expect(downloadProposalFile(7, 'Title')).rejects.toMatchObject({response: {data: {message: 'Attachment unavailable'}}})
    expect(window.URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('revokes the object URL even if the browser click fails', async () => {
    link.click.mockImplementation(() => { throw new Error('Browser blocked download') })
    await expect(downloadProposalFile(7, 'Title')).rejects.toThrow('Browser blocked download')
    expect(link.remove).toHaveBeenCalledOnce()
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:pdf')
  })

  it('extracts error messages from rejected blob responses', async () => {
    const data = new Blob(['{"message":"Not authorized"}'], {type: 'application/json'})
    expect(await proposalDownloadError({response: {status: 403, data}})).toBe('Not authorized')
  })
})
