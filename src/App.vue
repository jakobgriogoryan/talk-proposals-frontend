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
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import Navigation from './components/Navigation.vue'
import ToastContainer from './components/ToastContainer.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()

// Initialize auth on app mount, but don't block if it fails
onMounted(async () => {
  if (!authStore.user && !authStore.initializing) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      // Silently fail - user is not authenticated
    }
  }
})
</script>
