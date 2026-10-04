import { useAuthStore } from '../stores/auth'
import { getHomepageRoute } from '../composables/useAuthRedirect'

/** Resolve authentication once, then apply guest and role restrictions. */
export async function authGuard(to, from) {
  const auth = useAuthStore()
  if (auth.initializing || (!auth.user && !to.meta.guest)) {
    try {
      await auth.fetchUser()
    } catch {
      // A failed check grants no access; existing authentication remains authoritative.
    }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return { name: getHomepageRoute(auth) }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    const isPageRefresh = !from.name || from.name === to.name
    const query = !isPageRefresh && from.name !== 'Login' ? { redirect: to.fullPath } : {}
    return { name: 'Login', query }
  }

  if (to.meta.roles && auth.user) {
    const access = { speaker: auth.isSpeaker, reviewer: auth.isReviewer, admin: auth.isAdmin }
    if (!to.meta.roles.some(role => access[role] === true)) {
      return { name: getHomepageRoute(auth) }
    }
  }

  return true
}
