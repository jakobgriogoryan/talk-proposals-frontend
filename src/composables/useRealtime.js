import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import echo from '../config/echo'

/**
 * Composable for handling real-time WebSocket events
 */
export function useRealtime() {
  const authStore = useAuthStore()
  const notificationsStore = useNotificationsStore()

  let channels = []

  /**
   * Initialize real-time listeners
   */
  const initialize = () => {
    if (!authStore.isAuthenticated) {
      return
    }

    // Listen to general proposals channel (for admins and reviewers)
    if (authStore.isAdmin || authStore.isReviewer) {
      const proposalsChannel = echo.private('proposals')
      
      // Listen for new proposals
      proposalsChannel.listen('.proposal.submitted', (data) => {
        notificationsStore.push(data.message, 'info', 6000)
        // Emit custom event for components to refresh
        window.dispatchEvent(new CustomEvent('proposal-submitted', { detail: data }))
      })

      // Listen for reviews
      proposalsChannel.listen('.proposal.reviewed', (data) => {
        notificationsStore.push(data.message, 'info', 6000)
        window.dispatchEvent(new CustomEvent('proposal-reviewed', { detail: data }))
      })

      // Listen for status changes (ProposalStatusChanged event)
      proposalsChannel.listen('.ProposalStatusChanged', (data) => {
        const statusColors = {
          approved: 'success',
          rejected: 'error',
          pending: 'warning',
        }
        notificationsStore.push(data.message, statusColors[data.new_status] || 'info', 6000)
        window.dispatchEvent(new CustomEvent('proposal-status-changed', { detail: data }))
      })

      channels.push(proposalsChannel)
    }

    // Listen to user-specific channel (for speakers)
    if (authStore.user?.id) {
      const userChannel = echo.private(`user.${authStore.user.id}`)
      
      userChannel.listen('.proposal.submitted', (data) => {
        notificationsStore.push(`Your proposal "${data.proposal.title}" has been submitted`, 'success', 6000)
      })

      userChannel.listen('.proposal.reviewed', (data) => {
        notificationsStore.push(
          `Your proposal "${data.proposal.title}" received a new review (Rating: ${data.review.rating})`,
          'info',
          6000
        )
        window.dispatchEvent(new CustomEvent('proposal-reviewed', { detail: data }))
      })

      userChannel.listen('.ProposalStatusChanged', (data) => {
        const statusMessages = {
          approved: `Your proposal "${data.proposal?.title || 'proposal'}" has been approved! 🎉`,
          rejected: `Your proposal "${data.proposal?.title || 'proposal'}" has been rejected`,
          pending: `Your proposal "${data.proposal?.title || 'proposal'}" status changed to pending`,
        }
        const message = statusMessages[data.new_status] || data.message
        const type = data.new_status === 'approved' ? 'success' : data.new_status === 'rejected' ? 'error' : 'warning'
        notificationsStore.push(message, type, 8000)
        window.dispatchEvent(new CustomEvent('proposal-status-changed', { detail: data }))
      })

      channels.push(userChannel)
    }
  }

  /**
   * Listen to specific proposal channel (proposals.{id})
   */
  const listenToProposal = (proposalId, callbacks = {}) => {
    if (!authStore.isAuthenticated) {
      return null
    }

    const proposalChannel = echo.private(`proposals.${proposalId}`)

    if (callbacks.onReviewed) {
      proposalChannel.listen('.proposal.reviewed', callbacks.onReviewed)
    }

    if (callbacks.onStatusChanged) {
      // Listen to ProposalStatusChanged event
      proposalChannel.listen('.ProposalStatusChanged', callbacks.onStatusChanged)
    }

    channels.push(proposalChannel)
    return proposalChannel
  }

  /**
   * Disconnect all channels and clean up resources
   */
  const disconnect = () => {
    channels.forEach(channel => {
      try {
        // Stop listening to all events
        channel.stopListening('.proposal.submitted')
        channel.stopListening('.proposal.reviewed')
        channel.stopListening('.ProposalStatusChanged')
        // Leave the channel to fully disconnect
        channel.leave()
      } catch (error) {
        // Silently handle errors during cleanup
      }
    })
    channels = []
  }

  return {
    initialize,
    listenToProposal,
    disconnect,
  }
}

