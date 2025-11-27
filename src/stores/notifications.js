import { defineStore } from 'pinia'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
  }),

  getters: {
    all: (state) => state.notifications,
  },

  actions: {
    /**
     * Push a new notification.
     *
     * @param {string} message
     * @param {string} type - 'success' | 'error' | 'warning' | 'info'
     * @param {number} duration - Auto-close duration in milliseconds (default: 4000)
     */
    push(message, type = 'success', duration = 4000) {
      const id = Date.now() + Math.random()
      const notification = {
        id,
        message,
        type,
        duration,
      }

      this.notifications.push(notification)

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          this.remove(id)
        }, duration)
      }

      return id
    },

    /**
     * Remove a notification by id.
     *
     * @param {number|string} id
     */
    remove(id) {
      const index = this.notifications.findIndex((n) => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },

    /**
     * Clear all notifications.
     */
    clear() {
      this.notifications = []
    },
  },
})

