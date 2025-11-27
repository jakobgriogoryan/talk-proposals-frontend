<template>
  <div class="max-w-md mx-auto mt-8 sm:mt-12 lg:mt-16 px-4">
    <div class="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-100">
      <h1 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Login</h1>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            v-model="form.password"
            type="password"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
          />
        </div>
        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base font-medium"
        >
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-gray-600">
        Don't have an account?
        <router-link to="/register" class="text-blue-600 hover:text-blue-700 font-medium hover:underline decoration-2 underline-offset-2 transition-all">
          Register
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: '',
})

const error = ref('')
const loading = ref(false)

// Redirect if already authenticated
onMounted(async () => {
  // Fetch user if not loaded
  if (!authStore.user && !authStore.initializing) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      // User not authenticated, stay on login page
    }
  }

  // If authenticated, redirect to appropriate homepage
  if (authStore.isAuthenticated) {
    if (authStore.isAdmin) {
      router.push('/admin/proposals')
    } else if (authStore.isReviewer) {
      router.push('/review/proposals')
    } else if (authStore.isSpeaker) {
      router.push('/proposals')
    } else {
      router.push('/proposals')
    }
  }
})

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    await authStore.login(form.value)
    
    // Redirect to query redirect if provided, otherwise to role-based homepage
    if (route.query.redirect) {
      router.push(route.query.redirect)
    } else {
      // Redirect based on user role
      if (authStore.isAdmin) {
        router.push('/admin/proposals')
      } else if (authStore.isReviewer) {
        router.push('/review/proposals')
      } else if (authStore.isSpeaker) {
        router.push('/proposals')
      } else {
        router.push('/proposals')
      }
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

