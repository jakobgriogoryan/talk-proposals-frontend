import { defineStore } from 'pinia'
import { computed, onScopeDispose, ref } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const timers = new Map()
  let nextId = 0
  const all = computed(() => notifications.value)

  const remove = (id) => {
    clearTimeout(timers.get(id))
    timers.delete(id)
    notifications.value = notifications.value.filter(notification => notification.id !== id)
  }

  const clear = () => {
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
    notifications.value = []
  }

  const push = (message, type = 'success', duration = 4000) => {
    const id = ++nextId
    notifications.value.push({ id, message, type, duration })
    if (duration > 0) timers.set(id, setTimeout(() => remove(id), duration))
    return id
  }

  onScopeDispose(clear)
  return { notifications, all, push, remove, clear }
})
