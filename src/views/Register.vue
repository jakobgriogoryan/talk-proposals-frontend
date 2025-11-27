<template>
  <div class="max-w-md mx-auto mt-8 sm:mt-12 lg:mt-16 px-4">
    <div class="bg-white shadow-md rounded-lg p-6 sm:p-8">
      <h1 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Register</h1>
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            v-model="form.password_confirmation"
            type="password"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            v-model="form.role"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="speaker">Speaker</option>
            <option value="reviewer">Reviewer</option>
          </select>
        </div>
        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-gray-600">
        Already have an account?
        <router-link to="/login" class="text-blue-500 hover:underline">
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

