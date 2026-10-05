import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRenderer, h, nextTick, ref } from 'vue'

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(), getForReview: vi.fn(), getTopRated: vi.fn(),
  getTags: vi.fn(), loadNewProposal: vi.fn(), virtualize: vi.fn(),
}))

vi.mock('../src/api', () => ({
  proposalsApi: {
    getAll: mocks.getAll,
    getForReview: mocks.getForReview,
    getTopRated: mocks.getTopRated,
  },
  tagsApi: { getAll: mocks.getTags },
}))
vi.mock('../src/router/newProposal', () => ({ loadNewProposal: mocks.loadNewProposal }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@vueuse/core', () => ({ useWindowSize: () => ({ width: ref(1280) }) }))
vi.mock('@tanstack/vue-virtual', () => ({ useVirtualizer: (options) => mocks.virtualize(options) }))
vi.mock('../src/components/ProposalFilters.vue', () => ({ default: { render: () => null } }))
vi.mock('../src/components/SkeletonLoader.vue', () => ({ default: { render: () => null } }))

import Proposals from '../src/views/Proposals.vue'
import ReviewProposals from '../src/views/ReviewProposals.vue'
import TopRatedSlider from '../src/components/TopRatedSlider.vue'
import ProposalGrid from '../src/components/ProposalGrid.vue'

// Exercise real Vue rendering/lifecycle without adding a DOM test dependency.
const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null })
const renderer = createRenderer({
  createElement: type => node(type),
  createText: text => node('text', text),
  createComment: text => node('comment', text),
  patchProp: (el, key, previous, next) => { el.props[key] = next },
  setText: (el, text) => { el.text = text },
  setElementText: (el, text) => { el.text = text; el.children = [] },
  parentNode: el => el.parent,
  nextSibling: el => el.parent?.children[el.parent.children.indexOf(el) + 1] ?? null,
  insert(el, parent, anchor = null) {
    if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1)
    const index = anchor ? parent.children.indexOf(anchor) : -1
    parent.children.splice(index < 0 ? parent.children.length : index, 0, el)
    el.parent = parent
  },
  remove(el) {
    if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1)
    el.parent = null
  },
})
const find = (root, predicate) => {
  if (predicate(root)) return root
  for (const child of root.children) {
    const match = find(child, predicate)
    if (match) return match
  }
}
const findAll = (root, predicate) => [
  ...(predicate(root) ? [root] : []),
  ...root.children.flatMap(child => findAll(child, predicate)),
]
const mounted = []
const mount = (component, props = {}) => {
  const root = node('root')
  const app = renderer.createApp(component, props)
  app.component('RouterLink', {
    props: ['to'],
    setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()),
  })
  app.mount(root)
  mounted.push(app)
  return root
}
const settle = async () => {
  for (let i = 0; i < 8; i++) await nextTick()
}
const proposal = { id: 1, title: 'Example', description: 'Description', status: 'approved', tags: [], user: { name: 'Speaker' } }

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('window', { innerWidth: 1280, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  mocks.getAll.mockResolvedValue({ data: { data: { proposals: [proposal] } } })
  mocks.getForReview.mockResolvedValue({ data: { data: { proposals: [proposal] } } })
  mocks.getTopRated.mockResolvedValue({ data: { data: { proposals: [] } } })
  mocks.getTags.mockResolvedValue({ data: { data: { tags: [] } } })
  mocks.loadNewProposal.mockResolvedValue({ default: {} })
  mocks.virtualize.mockImplementation(() => ref({
    getVirtualItems: () => [], getTotalSize: () => 282, measure: vi.fn(),
  }))
})
afterEach(() => {
  mounted.splice(0).forEach(app => app.unmount())
  vi.unstubAllGlobals()
})

describe('proposal hover clearance', () => {
  it('preserves card selection and forwards deletion without conflating the two actions', () => {
    const select = vi.fn()
    const remove = vi.fn()
    const root = mount(ProposalGrid, { proposals: [proposal], clickable: true, onSelect: select })
    const grid = find(root, el => el.props['data-testid'] === 'proposal-grid')
    grid.children.find(el => el.props.onClick).props.onClick()
    expect(select).toHaveBeenCalledWith(proposal.id)
    const speaker = mount(ProposalGrid, { proposals: [proposal], showActions: true, onDelete: remove, onSelect: select })
    find(speaker, el => el.type === 'button' && el.text.trim() === 'Delete').props.onClick()
    find(speaker, el => el.props['data-testid'] === 'proposal-grid').children.find(el => el.props.onClick).props.onClick()
    expect(remove).toHaveBeenCalledWith(proposal.id)
    expect(select).toHaveBeenCalledTimes(1)
  })

  it('keeps carousel clipping while reserving space for the hover lift', async () => {
    mocks.getTopRated.mockResolvedValue({ data: { data: { proposals: [proposal] } } })
    const root = mount(TopRatedSlider)
    await settle()
    const viewport = find(root, el => el.props.class?.includes('overflow-hidden'))
    const track = find(viewport, el => el.props.class?.includes('transition-transform'))
    expect(track.props.class.split(' ')).toContain('py-3')
    expect(find(track, el => el.props.class?.includes('hover:-translate-y-1'))).toBeDefined()
  })

  it.each([['speaker', Proposals], ['reviewer', ReviewProposals]])('uses natural row heights and hover clearance for the %s paginated list', async (role, component) => {
    const proposals = Array.from({ length: 6 }, (_, index) => ({
      ...proposal, id: index + 1, title: `Long proposal title ${index + 1}`,
      tags: Array.from({ length: 12 }, (_, id) => ({ id, name: `Wrapping tag ${id}` })),
      user: { name: 'A speaker with a long name that wraps across multiple lines' },
    }))
    const response = { data: { data: { proposals } } }
    mocks.getAll.mockResolvedValue(response)
    mocks.getForReview.mockResolvedValue(response)
    const root = mount(component)
    await settle()
    expect(mocks.virtualize).not.toHaveBeenCalled()
    const grid = find(root, el => el.props['data-testid'] === 'proposal-grid')
    expect(grid).toBeDefined()
    expect(grid.props.class.split(' ')).toEqual(expect.arrayContaining([
      'grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3',
      'gap-4', 'sm:gap-6', 'pt-3', 'pb-5',
    ]))
    expect(findAll(grid, el => el.props.style?.position === 'absolute' || el.props.style?.height)).toHaveLength(0)
    expect(findAll(grid, el => /^\/proposals\/\d+$/.test(el.props.href))).toHaveLength(6)
    expect(findAll(grid, el => /\/edit$/.test(el.props.href))).toHaveLength(role === 'speaker' ? 6 : 0)
    expect(findAll(grid, el => el.type === 'button' && el.text.trim() === 'Delete')).toHaveLength(role === 'speaker' ? 6 : 0)
    expect(find(root, el => el.props.class === 'overflow-auto')).toBeUndefined()
  })
})

describe('new proposal route warming', () => {
  it('starts before the first click without waiting for the module or blocking list data', async () => {
    mocks.loadNewProposal.mockReturnValue(new Promise(() => {}))
    const root = mount(Proposals)
    await settle()
    expect(mocks.loadNewProposal).toHaveBeenCalledOnce()
    expect(mocks.getAll).toHaveBeenCalledOnce()
    expect(find(root, el => el.props.href === '/proposals/new')).toBeDefined()
    expect(find(root, el => el.props.href === '/proposals/1')).toBeDefined()
  })

  it('keeps the page usable after a preload failure and retries on pointer/keyboard intent', async () => {
    mocks.loadNewProposal.mockRejectedValueOnce(new Error('chunk unavailable'))
    const root = mount(Proposals)
    await settle()
    const link = find(root, el => el.props.href === '/proposals/new')
    link.props.onMouseenter()
    link.props.onFocus()
    await settle()
    expect(mocks.loadNewProposal).toHaveBeenCalledTimes(3)
    expect(mocks.getAll).toHaveBeenCalledOnce()
  })

  it('does not preload the creation form on the reviewer-only page', async () => {
    mount(ReviewProposals)
    await settle()
    expect(mocks.loadNewProposal).not.toHaveBeenCalled()
  })
})
