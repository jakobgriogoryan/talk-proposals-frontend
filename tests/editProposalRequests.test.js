import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { h, reactive } from 'vue'
import { deferred, find, node, renderer, settle, trigger } from './helpers/vue-renderer'

const mocks = vi.hoisted(() => ({ route: null, get: vi.fn(), update: vi.fn(), push: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => mocks.route, useRouter: () => ({ push: mocks.push }) }))
vi.mock('../src/api', () => ({ proposalsApi: { getOne: mocks.get, update: mocks.update } }))
vi.mock('../src/components/ProposalForm.vue', () => ({ default: {
  props: ['proposal', 'loading', 'errors'], emits: ['submit'],
  setup(props, { emit }) { return () => h('button', { disabled: props.loading, onClick: () => emit('submit', { title: props.proposal.title }) }, props.proposal.title) },
} }))
import EditProposal from '../src/views/EditProposal.vue'

const apps = []
const response = id => ({ data: { data: { proposal: { id, title: `Proposal ${id}`, tags: [] } } } })
beforeEach(() => { vi.resetAllMocks(); mocks.route = reactive({ params: { id: '1' } }) })
afterEach(() => apps.splice(0).forEach(app => app.unmount()))
const mount = () => {
  const root = node('root'), app = renderer.createApp(EditProposal)
  app.mount(root); apps.push(app)
  return root
}
it.each(['resolve', 'reject'])('reloads on route changes and ignores an older %s', async result => {
  const old = deferred()
  mocks.get.mockImplementation(id => id === '1' ? old.promise : Promise.resolve(response(id)))
  const root = mount()
  mocks.route.params.id = '2'
  await settle()
  expect(find(root, el => el.type === 'button').text).toBe('Proposal 2')
  if (result === 'resolve') old.resolve(response('1'))
  else old.reject(new Error('Stale failure'))
  await settle()
  expect(find(root, el => el.type === 'button').text).toBe('Proposal 2')
  expect(mocks.push).not.toHaveBeenCalled()
})
it('does not redirect a newer page when an earlier save finishes', async () => {
  mocks.get.mockImplementation(id => Promise.resolve(response(id)))
  const save = deferred()
  mocks.update.mockReturnValue(save.promise)
  const root = mount()
  await settle()
  trigger(find(root, el => el.type === 'button'), 'click')
  expect(mocks.update).toHaveBeenCalledWith('1', { title: 'Proposal 1' })
  mocks.route.params.id = '2'
  await settle()
  save.resolve(response('1'))
  await settle()
  expect(find(root, el => el.type === 'button').text).toBe('Proposal 2')
  expect(mocks.push).not.toHaveBeenCalled()
})
it('does not redirect after the edit view unmounts during a request', async () => {
  const request = deferred()
  mocks.get.mockReturnValue(request.promise)
  mount()
  apps.pop().unmount()
  request.reject(new Error('Late failure'))
  await settle()
  expect(mocks.push).not.toHaveBeenCalled()
})
