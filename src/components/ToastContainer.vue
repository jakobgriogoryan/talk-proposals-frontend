<template>
  <div
    class="fixed top-4 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-xs sm:max-w-md w-[calc(100%-2rem)] sm:w-auto"
    aria-live="polite"
    aria-atomic="true"
  >
    <TransitionGroup
      name="toast"
      tag="div"
      class="flex flex-col gap-2"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg flex items-center justify-between gap-2 sm:gap-4 w-full',
          getToastClass(notification.type),
        ]"
        role="alert"
      >
        <div class="flex items-center gap-3 flex-1">
          <svg
            v-if="notification.type === 'success'"
            class="w-5 h-5 text-white flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <svg
            v-else-if="notification.type === 'error'"
            class="w-5 h-5 text-white flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <p class="text-xs sm:text-sm font-medium text-white flex-1 break-words">
            {{ notification.message }}
          </p>
        </div>
        <button
          @click="remove(notification.id)"
          class="text-white hover:text-gray-200 flex-shrink-0 transition-colors"
          aria-label="Close notification"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationsStore } from '../stores/notifications'

const notificationsStore = useNotificationsStore()

const notifications = computed(() => notificationsStore.all)

const getToastClass = (type) => {
  const classes = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
  }
  return classes[type] || classes.info
}

const remove = (id) => {
  notificationsStore.remove(id)
}
</script>

<style scoped>
/* Toast enter/leave animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>

