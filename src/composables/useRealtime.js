import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { useCacheStore } from '../stores/cache'
import echo from '../config/echo'

export const REALTIME_EVENTS = Object.freeze({
  submitted: '.proposal.submitted',
  reviewed: '.proposal.reviewed',
  statusChanged: '.proposal.status.changed',
})

const statusColors = {
  approved: 'success',
  rejected: 'error',
  pending: 'warning',
}

/**
 * Owns every Echo subscription created by one consumer so it can remove the
 * exact callbacks and leave the corresponding private channels.
 */
export function useRealtime() {
  const authStore = useAuthStore()
  const notificationsStore = useNotificationsStore()
  const cacheStore = useCacheStore()
  const channels = new Map()
  const recentlyHandledEvents = new Map()

  const eventKey = (eventName, data) => {
    const proposalId = data.proposal_id ?? data.proposal?.id ?? 'unknown'
    const detail = data.review?.id ?? data.new_status ?? ''

    return `${eventName}:${proposalId}:${detail}`
  }

  const handleOnce = (eventName, data, handler) => {
    const now = Date.now()

    for (const [key, handledAt] of recentlyHandledEvents) {
      if (now - handledAt > 5000) {
        recentlyHandledEvents.delete(key)
      }
    }

    const key = eventKey(eventName, data)
    const handledAt = recentlyHandledEvents.get(key)

    if (handledAt && now - handledAt <= 5000) {
      return
    }

    recentlyHandledEvents.set(key, now)
    handler()
  }

  const stopChannel = (channelName, expectedChannel = null) => {
    const registration = channels.get(channelName)

    if (!registration || (expectedChannel && registration.channel !== expectedChannel)) {
      return
    }

    registration.listeners.forEach((callback, eventName) => {
      registration.channel.stopListening(eventName, callback)
    })

    echo.leave(channelName)
    channels.delete(channelName)
  }

  const subscribe = (channelName, listeners) => {
    stopChannel(channelName)

    const channel = echo.private(channelName)
    const registeredListeners = new Map()

    Object.entries(listeners).forEach(([eventName, callback]) => {
      if (typeof callback !== 'function') {
        return
      }

      channel.listen(eventName, callback)
      registeredListeners.set(eventName, callback)
    })

    channels.set(channelName, { channel, listeners: registeredListeners })

    return () => stopChannel(channelName, channel)
  }

  const invalidateProposalCaches = (data) => {
    cacheStore.invalidatePrefix('proposals:')
    const proposalId = data.proposal_id ?? data.proposal?.id
    cacheStore.invalidatePrefix(proposalId ? `reviews:proposal:${proposalId}:` : 'reviews:proposal:')
  }

  const dispatch = (eventName, data) => {
    invalidateProposalCaches(data)
    if (eventName === 'proposal-submitted') cacheStore.invalidatePrefix('tags:')
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }))
  }

  const handleSubmitted = (data, ownerMessage = false) => {
    handleOnce(REALTIME_EVENTS.submitted, data, () => {
      const message = ownerMessage
        ? `Your proposal "${data.proposal.title}" has been submitted`
        : data.message

      notificationsStore.push(message, ownerMessage ? 'success' : 'info', 6000)
      dispatch('proposal-submitted', data)
    })
  }

  const handleReviewed = (data, ownerMessage = false) => {
    handleOnce(REALTIME_EVENTS.reviewed, data, () => {
      const message = ownerMessage
        ? `Your proposal "${data.proposal.title}" received a new review (Rating: ${data.review.rating})`
        : data.message

      notificationsStore.push(message, 'info', 6000)
      dispatch('proposal-reviewed', data)
    })
  }

  const handleStatusChanged = (data, ownerMessage = false) => {
    handleOnce(REALTIME_EVENTS.statusChanged, data, () => {
      const ownerMessages = {
        approved: `Your proposal "${data.proposal?.title || 'proposal'}" has been approved! 🎉`,
        rejected: `Your proposal "${data.proposal?.title || 'proposal'}" has been rejected`,
        pending: `Your proposal "${data.proposal?.title || 'proposal'}" status changed to pending`,
      }
      const message = ownerMessage ? ownerMessages[data.new_status] || data.message : data.message
      const type = statusColors[data.new_status] || 'info'

      notificationsStore.push(message, type, ownerMessage ? 8000 : 6000)
      dispatch('proposal-status-changed', data)
    })
  }

  const disconnect = () => {
    Array.from(channels.keys()).forEach((channelName) => stopChannel(channelName))
    recentlyHandledEvents.clear()
  }

  const initialize = () => {
    disconnect()

    if (!authStore.isAuthenticated) {
      return
    }

    if (authStore.isReviewer) {
      subscribe('proposals', {
        [REALTIME_EVENTS.submitted]: (data) => handleSubmitted(data),
        [REALTIME_EVENTS.reviewed]: (data) => handleReviewed(data),
        [REALTIME_EVENTS.statusChanged]: (data) => handleStatusChanged(data),
      })
    }

    if (authStore.user?.id) {
      subscribe(`user.${authStore.user.id}`, {
        [REALTIME_EVENTS.submitted]: (data) => handleSubmitted(data, true),
        [REALTIME_EVENTS.reviewed]: (data) => handleReviewed(data, true),
        [REALTIME_EVENTS.statusChanged]: (data) => handleStatusChanged(data, true),
      })
    }
  }

  const listenToProposal = (proposalId, callbacks = {}) => {
    if (!authStore.isAuthenticated || !proposalId) {
      return () => {}
    }

    const listeners = {}
    for (const [eventName, callback] of [
      [REALTIME_EVENTS.reviewed, callbacks.onReviewed],
      [REALTIME_EVENTS.statusChanged, callbacks.onStatusChanged],
    ]) {
      if (typeof callback === 'function') {
        listeners[eventName] = data => {
          invalidateProposalCaches(data)
          callback(data)
        }
      }
    }
    return subscribe(`proposals.${proposalId}`, listeners)
  }

  return {
    initialize,
    listenToProposal,
    disconnect,
  }
}
