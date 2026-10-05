import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, ref } from 'vue'
import { deferred, find, node, renderer, settle, trigger } from './helpers/vue-renderer'

const mocks = vi.hoisted(() => ({ get: vi.fn(), tags: vi.fn(), updateStatus: vi.fn() }))
vi.mock('../src/api', () => ({
  proposalsApi: { getAll: mocks.get, getForReview: mocks.get, getAllForAdmin: mocks.get, updateStatus: mocks.updateStatus },
  tagsApi: { getAll: mocks.tags },
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@vueuse/core', () => ({ useWindowSize: () => ({ width: ref(1200) }) }))
vi.mock('@tanstack/vue-virtual', () => ({ useVirtualizer: () => ref({
  getVirtualItems: () => [], getTotalSize: () => 0, measure: vi.fn(),
}) }))
vi.mock('../src/router/newProposal', () => ({ loadNewProposal: () => Promise.resolve() }))
vi.mock('../src/components/TopRatedSlider.vue', () => ({ default: { render: () => null } }))
vi.mock('../src/components/ProposalFilters.vue', () => ({ default: {
  props: ['filters'],
  emits: ['update:filters'],
  setup(props, { emit }) { return () => h('button', { 'data-testid': 'filter', 'data-search': props.filters.search, onClick: () => emit('update:filters', { search: 'Changed', tags: [], status: '' }) }, 'Filter') },
} }))
vi.mock('../src/components/AppSelect.vue', () => ({ default: {
  emits: ['change'], setup(props, { emit }) { return () => h('button', { 'data-testid': 'status', onClick: () => emit('change', 'approved') }, 'Approve') },
} }))
vi.mock('../src/components/ProposalCard.vue', () => ({ default: {
  props: ['proposal'], setup: props => () => h('section', [
    h('h3', props.proposal.title), h('p', props.proposal.description),
  ]),
} }))
vi.mock('../src/components/SkeletonLoader.vue', () => ({ default: { render: () => h('div', { 'data-testid': 'loading' }) } }))
import Proposals from '../src/views/Proposals.vue'
import ReviewProposals from '../src/views/ReviewProposals.vue'
import AdminProposals from '../src/views/AdminProposals.vue'

const apps = []
beforeEach(() => {
  vi.clearAllMocks()
  mocks.tags.mockResolvedValue({ data: { data: { tags: [] } } })
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() })
})
afterEach(() => { apps.splice(0).forEach(app => app.unmount()); vi.unstubAllGlobals() })
const response = title => ({ data: { data: {
  proposals: [{ id: 1, title, description: '', status: 'pending', tags: [], user: {} }],
  pagination: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
} } })
const mount = component => {
  const root = node('root'), app = renderer.createApp(component)
  app.component('router-link', { render() { return h('span', null, this.$slots.default?.()) } })
  app.mount(root); apps.push(app)
  return root
}

describe.each([['speaker', Proposals], ['reviewer', ReviewProposals], ['admin', AdminProposals]])('%s proposal request ordering', (_name, component) => {
  it('refreshes proposal content even when identity, title and status are unchanged', async () => {
    const initial = response('Same title')
    initial.data.data.proposals[0].description = 'Original description'
    mocks.get.mockResolvedValueOnce(initial)
    const root = mount(component)
    await settle()
    expect(find(root, el => el.text === 'Original description')).toBeDefined()

    const updated = response('Same title')
    updated.data.data.proposals[0].description = 'Updated description'
    mocks.get.mockResolvedValueOnce(updated)
    const listener = window.addEventListener.mock.calls.find(([name]) => name === 'proposal-status-changed')[1]
    listener()
    await settle()

    expect(find(root, el => el.text === 'Updated description')).toBeDefined()
    expect(find(root, el => el.text === 'Original description')).toBeUndefined()
  })

  it('keeps the controlled filters in sync with the serialized request', async () => {
    mocks.get.mockResolvedValue(response('Results'))
    const root = mount(component)
    const filter = find(root, el => el.props['data-testid'] === 'filter')
    expect(filter.props['data-search']).toBe('')
    trigger(filter, 'click')
    await settle()
    expect(filter.props['data-search']).toBe('Changed')
    expect(mocks.get).toHaveBeenLastCalledWith({ page: 1, search: 'Changed' })
  })
  it('ignores an older success after the latest filter request resolves', async () => {
    const old = deferred(), latest = deferred()
    mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    const root = mount(component)
    trigger(find(root, el => el.props['data-testid'] === 'filter'), 'click')
    latest.resolve(response('Latest results'))
    await settle()
    expect(find(root, el => el.text === 'Latest results')).toBeDefined()
    old.resolve(response('Old results'))
    await settle()
    expect(find(root, el => el.text === 'Old results')).toBeUndefined()
  })

  it.each(['resolve', 'reject'])('keeps loading while an older request finishes with %s', async result => {
    const old = deferred(), latest = deferred()
    mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    const root = mount(component)
    trigger(find(root, el => el.props['data-testid'] === 'filter'), 'click')
    if (result === 'resolve') old.resolve(response('Old results'))
    else old.reject(new Error('Old request failed'))
    await settle()
    expect(find(root, el => el.props['data-testid'] === 'loading' || el.text === 'Loading...')).toBeDefined()
    latest.resolve(response('Latest results'))
    await settle()
    expect(find(root, el => el.props['data-testid'] === 'loading' || el.text === 'Loading...')).toBeUndefined()
  })
})

it('reloads the admin list after a status mutation without depending on a broadcast', async () => {
  mocks.get.mockResolvedValue(response('Pending result'))
  mocks.updateStatus.mockResolvedValue({ data: { data: { proposal: { id: 1, status: 'approved' } } } })
  const root = mount(AdminProposals)
  await settle()
  mocks.get.mockResolvedValue({ data: { data: { proposals: [], pagination: { current_page: 1, last_page: 1, total: 0, per_page: 15 } } } })
  trigger(find(root, el => el.props['data-testid'] === 'status'), 'click')
  await settle()
  expect(mocks.updateStatus).toHaveBeenCalledWith(1, 'approved')
  expect(mocks.get).toHaveBeenCalledTimes(2)
  expect(find(root, el => el.text === 'No proposals found.')).toBeDefined()
})
