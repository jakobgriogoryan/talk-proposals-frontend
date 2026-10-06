import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './authGuard'
import { loadNewProposal } from './newProposal'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/Register.vue'),
      meta: { guest: true },
    },
    {
      path: '/proposals',
      name: 'Proposals',
      component: () => import('../views/Proposals.vue'),
      meta: { requiresAuth: true, roles: ['speaker', 'admin'] },
    },
    {
      path: '/proposals/new',
      name: 'NewProposal',
      component: loadNewProposal,
      meta: { requiresAuth: true, roles: ['speaker', 'admin'] },
    },
    {
      path: '/proposals/:id',
      name: 'ProposalDetail',
      component: () => import('../views/ProposalDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/proposals/:id/edit',
      name: 'EditProposal',
      component: () => import('../views/EditProposal.vue'),
      meta: { requiresAuth: true, roles: ['speaker', 'admin'] },
    },
    {
      path: '/review/proposals',
      name: 'ReviewProposals',
      component: () => import('../views/ReviewProposals.vue'),
      meta: { requiresAuth: true, roles: ['reviewer', 'admin'] },
    },
    {
      path: '/admin/proposals',
      name: 'AdminProposals',
      component: () => import('../views/AdminProposals.vue'),
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    {
      path: '/',
      redirect: '/login',
    },
  ],
})

router.beforeEach(authGuard)

export default router
