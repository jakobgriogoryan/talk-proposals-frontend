<template>
  <div id="app" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-ocean-900 dark:via-ocean-800 dark:to-ocean-900 transition-colors">
    <Navigation />
    <main class="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <router-view />
    </main>
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import { useRealtime } from './composables/useRealtime'
import { createRealtimeSession } from './composables/realtimeSession'
import { authApi } from './api/auth'
import Navigation from './components/Navigation.vue'
import ToastContainer from './components/ToastContainer.vue'

const authStore = useAuthStore()
useThemeStore()
const { initialize, disconnect } = useRealtime()
const realtimeSession = createRealtimeSession({
  disconnect,
  initialize: (userId) => {
    if (authStore.user?.id === userId) {
      initialize()
    }
  },
})

// Initialize CSRF cookie on app mount
onMounted(async () => {
  // Fetch CSRF cookie on app initialization for Sanctum SPA
  // Note: User fetching is handled by router's beforeEach guard
  try {
    await authApi.getCsrfCookie()
  } catch (error) {
    // Silently fail - CSRF cookie fetch is best effort
  }
})

// Reconnect for the current identity, including direct account switches.
const stopAuthWatch = watch(
  () => authStore.user?.id ?? null,
  (userId) => realtimeSession.sync(userId),
  { immediate: true }
)

// Cleanup on unmount
onUnmounted(() => {
  stopAuthWatch()
  realtimeSession.dispose()
})
</script>
