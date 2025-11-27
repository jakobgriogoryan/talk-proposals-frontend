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

  // Wait for any ongoing initialization to complete (max 1 second)
  if (authStore.initializing) {
    let attempts = 0
    while (authStore.initializing && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 50))
      attempts++
    }
  }

  // Only fetch user if not loaded and not initializing
  if (!authStore.user && !authStore.initializing) {
    try {
      await authStore.fetchUser()
    } catch (error) {}
  }

  // Check if route is for guests only - redirect authenticated users to homepage
  if (to.meta.guest && authStore.isAuthenticated) {
    // Redirect authenticated users away from login/register to their homepage
    if (authStore.isAdmin) return next({ name: 'AdminProposals' })
    if (authStore.isReviewer) return next({ name: 'ReviewProposals' })
    if (authStore.isSpeaker) return next({ name: 'Proposals' })
    return next({ name: 'Proposals' })
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (authStore.initializing) {
      let waitAttempts = 0
      while (authStore.initializing && waitAttempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        waitAttempts++
      }
    }

    // If not authenticated after initialization completes, redirect to login
    if (!authStore.isAuthenticated) {
      if (to.name === 'Login') {
        return next()
      }

      const isPageRefresh = !from.name || from.name === to.name
      const redirectQuery = !isPageRefresh && from.name !== 'Login'
          ? { redirect: to.fullPath }
          : {}
      return next({ name: 'Login', query: redirectQuery })
    }
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

  // Allow navigation to proceed
  next()
})

export default router

