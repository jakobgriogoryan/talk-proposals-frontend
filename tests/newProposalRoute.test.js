import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', async (importOriginal) => {
  const router = await importOriginal()
  return { ...router, createWebHistory: router.createMemoryHistory }
})
vi.mock('../src/views/NewProposal.vue', () => ({
  default: { name: 'NewProposal', render: () => null },
}))
vi.mock('../src/views/ReviewProposals.vue', () => ({
  default: { name: 'ReviewProposals', render: () => null },
}))

import router from '../src/router'
import { loadNewProposal } from '../src/router/newProposal'
import { useAuthStore } from '../src/stores/auth'

beforeEach(() => setActivePinia(createPinia()))

describe('new proposal route loading', () => {
  it('uses the same lazy loader for navigation and background warming', async () => {
    const route = router.getRoutes().find(route => route.name === 'NewProposal')
    expect(route.components.default).toBe(loadNewProposal)
    const warmed = await loadNewProposal()
    expect(await route.components.default()).toBe(warmed)
    expect(route.meta.roles).toEqual(['speaker', 'admin'])
  })

  it.each(['speaker', 'admin'])('allows an authenticated %s to open the warmed form', async (role) => {
    useAuthStore().user = { id: 1, role }
    await loadNewProposal()
    await router.push('/proposals/new')
    expect(router.currentRoute.value.name).toBe('NewProposal')
  })

  it('does not grant reviewers access to the creation route', async () => {
    useAuthStore().user = { id: 2, role: 'reviewer' }
    await router.push('/review/proposals')
    await router.push('/proposals/new')
    expect(router.currentRoute.value.name).toBe('ReviewProposals')
  })
})
