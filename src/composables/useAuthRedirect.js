import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

/**
 * Get the homepage route name for a given auth store
 * Can be used in router guards (non-composable context)
 * @param {Object} authStore - Auth store instance
 * @returns {string} Route name
 */
export function getHomepageRoute(authStore) {
  if (authStore.isAdmin) {
    return 'AdminProposals'
  }
  if (authStore.isReviewer) {
    return 'ReviewProposals'
  }
  if (authStore.isSpeaker) {
    return 'Proposals'
  }
  // Default fallback
  return 'Proposals'
}

/**
 * Get the homepage path for a given auth store
 * Can be used in router guards (non-composable context)
 * @param {Object} authStore - Auth store instance
 * @returns {string} Route path
 */
export function getHomepagePath(authStore) {
  if (authStore.isAdmin) {
    return '/admin/proposals'
  }
  if (authStore.isReviewer) {
    return '/review/proposals'
  }
  if (authStore.isSpeaker) {
    return '/proposals'
  }
  // Default fallback
  return '/proposals'
}

/**
 * Composable for handling role-based redirects to user homepages
 */
export function useAuthRedirect() {
  const router = useRouter()
  const authStore = useAuthStore()

  /**
   * Redirect to user's role-based homepage
   */
  const redirectToHomepage = () => {
    router.push(getHomepagePath(authStore))
  }

  /**
   * Redirect to user's role-based homepage using route name
   */
  const redirectToHomepageByName = () => {
    router.push({ name: getHomepageRoute(authStore) })
  }

  return {
    getHomepageRoute: () => getHomepageRoute(authStore),
    getHomepagePath: () => getHomepagePath(authStore),
    redirectToHomepage,
    redirectToHomepageByName,
  }
}

