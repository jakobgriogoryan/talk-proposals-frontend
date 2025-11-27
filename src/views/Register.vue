<template>
  <div class="max-w-md mx-auto mt-8 sm:mt-12 lg:mt-16 px-4">
    <div class="bg-white/90 dark:bg-ocean-800/90 backdrop-blur-sm shadow-lg rounded-xl p-6 sm:p-8 border border-gray-200/50 dark:border-ocean-700/50 transition-colors">
      <h1 class="text-xl sm:text-2xl font-bold mb-5 sm:mb-6 text-center bg-gradient-to-r from-blue-600 to-blue-800 dark:from-ocean-400 dark:to-ocean-300 bg-clip-text text-transparent">Register</h1>
      <form @submit.prevent="handleRegister" class="space-y-4 sm:space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-ocean-300 mb-1.5">
            Name
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full px-3.5 py-2.5 border border-gray-200 dark:border-ocean-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-ocean-400/50 focus:border-blue-400 dark:focus:border-ocean-500 transition-all shadow-sm hover:shadow-md bg-white dark:bg-ocean-900/50 text-gray-900 dark:text-ocean-100 placeholder-gray-400 dark:placeholder-ocean-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-ocean-300 mb-1.5">
            Email
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full px-3.5 py-2.5 border border-gray-200 dark:border-ocean-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-ocean-400/50 focus:border-blue-400 dark:focus:border-ocean-500 transition-all shadow-sm hover:shadow-md bg-white dark:bg-ocean-900/50 text-gray-900 dark:text-ocean-100 placeholder-gray-400 dark:placeholder-ocean-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-ocean-300 mb-1.5">
            Password
          </label>
          <input
            v-model="form.password"
            type="password"
            required
            class="w-full px-3.5 py-2.5 border border-gray-200 dark:border-ocean-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-ocean-400/50 focus:border-blue-400 dark:focus:border-ocean-500 transition-all shadow-sm hover:shadow-md bg-white dark:bg-ocean-900/50 text-gray-900 dark:text-ocean-100 placeholder-gray-400 dark:placeholder-ocean-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-ocean-300 mb-1.5">
            Confirm Password
          </label>
          <input
            v-model="form.password_confirmation"
            type="password"
            required
            class="w-full px-3.5 py-2.5 border border-gray-200 dark:border-ocean-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-ocean-400/50 focus:border-blue-400 dark:focus:border-ocean-500 transition-all shadow-sm hover:shadow-md bg-white dark:bg-ocean-900/50 text-gray-900 dark:text-ocean-100 placeholder-gray-400 dark:placeholder-ocean-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-ocean-300 mb-1.5">
            Role
          </label>
          <select
            v-model="form.role"
            required
            class="w-full px-3.5 py-2.5 border border-gray-200 dark:border-ocean-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-ocean-400/50 focus:border-blue-400 dark:focus:border-ocean-500 transition-all shadow-sm hover:shadow-md appearance-none bg-white dark:bg-ocean-900/50 text-gray-900 dark:text-ocean-100"
          >
            <option value="speaker" class="bg-white dark:bg-ocean-900">Speaker</option>
            <option value="reviewer" class="bg-white dark:bg-ocean-900">Reviewer</option>
          </select>
        </div>
        <div v-if="error" class="text-red-500 dark:text-red-400 text-sm py-1">{{ error }}</div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-ocean-400 dark:to-ocean-500 text-white px-4 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-ocean-500 dark:hover:to-ocean-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] text-sm sm:text-base font-medium"
        >
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
      </form>
      <p class="mt-5 text-center text-sm text-gray-500 dark:text-ocean-400">
        Already have an account?
        <router-link to="/login" class="text-blue-600 dark:text-ocean-300 hover:text-blue-700 dark:hover:text-ocean-200 font-medium hover:underline decoration-2 underline-offset-2 transition-all">
          Login
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'speaker',
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
      // User not authenticated, stay on register page
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

const handleRegister = async () => {
  error.value = ''
  loading.value = true
  try {
    await authStore.register(form.value)
    
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
  } catch (err) {
    error.value = err.response?.data?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

