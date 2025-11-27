<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <Navigation />
    <main class="container mx-auto px-4 py-8">
      <router-view />
    </main>
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import Navigation from './components/Navigation.vue'
import ToastContainer from './components/ToastContainer.vue'

const authStore = useAuthStore()

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
