import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { find, node, renderer, settle, trigger } from './helpers/vue-renderer'
import { MAX_PROPOSAL_FILE_BYTES } from '../src/config/proposals'

vi.mock('../src/api', () => ({ tagsApi: { getAll: () => Promise.resolve({ data: { data: { tags: [] } } }) } }))
vi.mock('../src/utils/proposalDownload', () => ({ downloadProposalFile: vi.fn(), proposalDownloadError: vi.fn() }))
import ProposalForm from '../src/components/ProposalForm.vue'

const apps = []
let submit
beforeEach(() => { submit = vi.fn() })
afterEach(() => apps.splice(0).forEach(app => app.unmount()))
const mount = () => {
  const root = node('root'), app = renderer.createApp({ render: () => h(ProposalForm, { onSubmit: submit }) })
  app.component('router-link', { render: () => null })
  app.mount(root); apps.push(app)
  return root
}
const select = (root, file) => trigger(find(root, el => el.props.type === 'file'), 'change', { target: { files: [file], value: file.name } })

it.each([
  { name: 'test.pdf', type: 'application/pdf', size: MAX_PROPOSAL_FILE_BYTES },
  { name: 'TEST.PDF', type: '', size: 100 },
])('accepts a PDF at the size boundary or without browser MIME metadata', async file => {
  const root = mount()
  select(root, file)
  await settle()
  trigger(find(root, el => el.type === 'form'), 'submit')
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ file }))
})
it.each([
  { name: 'test.pdf', type: 'application/pdf', size: MAX_PROPOSAL_FILE_BYTES + 1 },
  { name: 'test.txt', type: 'text/plain', size: 100 },
])('does not silently submit without a rejected attachment', async file => {
  const root = mount()
  select(root, file)
  await settle()
  const form = find(root, el => el.type === 'form')
  trigger(form, 'submit'); trigger(form, 'submit')
  expect(submit).not.toHaveBeenCalled()
  const clear = find(root, el => el.type === 'button' && el.text === 'Clear selected file')
  expect(clear).toBeDefined()
  trigger(clear, 'click')
  await settle()
  trigger(form, 'submit')
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ file: null }))
})
