import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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
      component: () => import('../views/NewProposal.vue'),
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

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Only fetch user if not already loaded and route is not a guest route
  // This prevents redirect loops when accessing login/register
  if (!to.meta.guest && !authStore.user && !authStore.initializing) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      // User not authenticated - silently fail, will be caught by requiresAuth check
      // Don't redirect here to avoid loops
    }
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  // Check if route is for guests only
  if (to.meta.guest && authStore.isAuthenticated) {
    // Redirect authenticated users away from login/register
    if (authStore.isSpeaker) return next({ name: 'Proposals' })
    if (authStore.isReviewer) return next({ name: 'ReviewProposals' })
    if (authStore.isAdmin) return next({ name: 'AdminProposals' })
    return next({ name: 'Proposals' })
  }

  // Check role-based access
  if (to.meta.roles && authStore.user) {
    const hasAccess = to.meta.roles.some(role => {
      if (role === 'speaker') return authStore.isSpeaker
      if (role === 'reviewer') return authStore.isReviewer
      if (role === 'admin') return authStore.isAdmin
      return false
    })

    if (!hasAccess) {
      // Redirect based on user role
      if (authStore.isSpeaker) return next({ name: 'Proposals' })
      if (authStore.isReviewer) return next({ name: 'ReviewProposals' })
      if (authStore.isAdmin) return next({ name: 'AdminProposals' })
      return next({ name: 'Login' })
    }
  }

  next()
})

export default router

