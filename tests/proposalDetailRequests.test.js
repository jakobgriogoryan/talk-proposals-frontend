import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { deferred, find, node, renderer, settle } from './helpers/vue-renderer'

const mocks = vi.hoisted(() => ({ getOne: vi.fn(), getReviews: vi.fn(), getRatings: vi.fn(), listen: vi.fn(), route: null }))
vi.mock('vue-router', () => ({ useRoute: () => mocks.route }))
vi.mock('../src/api', () => ({
  proposalsApi: { getOne: mocks.getOne },
  reviewsApi: { getForProposal: mocks.getReviews, getRatingOptions: mocks.getRatings },
}))
vi.mock('../src/api/axios', () => ({ default: {} }))
vi.mock('../src/stores/auth', () => ({ useAuthStore: () => ({ user: { id: 1 }, isAdmin: false, isReviewer: true }) }))
vi.mock('../src/stores/notifications', () => ({ useNotificationsStore: () => ({ push: vi.fn() }) }))
vi.mock('../src/composables/useRealtime', () => ({ useRealtime: () => ({ listenToProposal: mocks.listen }) }))
vi.mock('../src/components/ReviewForm.vue', () => ({ default: { render: () => null } }))
vi.mock('../src/components/ReviewList.vue', () => ({ default: { render: () => null } }))
vi.mock('../src/components/SkeletonLoader.vue', () => ({ default: { render: () => null } }))
import ProposalDetail from '../src/views/ProposalDetail.vue'

const apps = []
beforeEach(() => {
  vi.clearAllMocks()
  mocks.route = reactive({ params: { id: '1' } })
  mocks.getReviews.mockResolvedValue({ data: { data: { reviews: [] } } })
  mocks.getRatings.mockResolvedValue({ data: { data: { ratings: [] } } })
  mocks.listen.mockReturnValue(() => {})
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() })
})
afterEach(() => { apps.splice(0).forEach(app => app.unmount()); vi.unstubAllGlobals() })
const response = id => ({ data: { data: { proposal: { id, title: `Proposal ${id}`, status: 'pending', tags: [], user: {} } } } })

describe('proposal navigation request ordering', () => {
  it('reloads proposal and reviews when its private channel resubscribes', async () => {
    mocks.getOne.mockResolvedValue(response('1'))
    const root = node('root'), app = renderer.createApp(ProposalDetail)
    app.mount(root); apps.push(app)
    await settle()
    const updated = response('1')
    updated.data.data.proposal.title = 'Current server state'
    mocks.getOne.mockResolvedValue(updated)
    mocks.listen.mock.calls[0][1].onResynced()
    await settle()
    expect(mocks.getOne).toHaveBeenCalledTimes(2)
    expect(mocks.getReviews).toHaveBeenCalledTimes(2)
    expect(find(root, el => el.type === 'h1').text).toBe('Current server state')
  })
  it.each(['resolve', 'reject'])('ignores an older request that finishes with %s after navigation', async result => {
    const old = deferred()
    mocks.getOne.mockImplementation(id => id === '1' ? old.promise : Promise.resolve(response(id)))
    const root = node('root'), app = renderer.createApp(ProposalDetail)
    app.mount(root); apps.push(app)
    mocks.route.params.id = '2'
    await settle()
    expect(find(root, el => el.type === 'h1').text).toBe('Proposal 2')
    if (result === 'resolve') old.resolve(response('1'))
    else old.reject(new Error('Old request failed'))
    await settle()
    expect(find(root, el => el.type === 'h1').text).toBe('Proposal 2')
  })
})
