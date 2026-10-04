<template>
  <div class="max-w-md mx-auto mt-8 sm:mt-12 lg:mt-16 px-4">
    <div class="bg-white/90 dark:bg-ocean-800/90 backdrop-blur-sm shadow-lg rounded-xl p-6 sm:p-8 border border-gray-200/50 dark:border-ocean-700/50 transition-colors">
      <h1 class="text-xl sm:text-2xl font-bold mb-5 sm:mb-6 text-center bg-gradient-to-r from-blue-600 to-blue-800 dark:from-ocean-400 dark:to-ocean-300 bg-clip-text text-transparent">Register</h1>
      <form @submit.prevent="handleRegister" class="space-y-4 sm:space-y-5" autocomplete="on">
        <div>
          <label for="register-name" class="block text-sm font-medium text-gray-600 dark:text-ocean-300 mb-1.5">
            Name
          </label>
          <input
            id="register-name"
            v-model="form.name"
            type="text"
            name="name"
            autocomplete="name"
            required
            :class="[
              'w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md bg-white dark:bg-ocean-900/50 text-gray-900 dark:text-ocean-100 placeholder-gray-400 dark:placeholder-ocean-500',
              errors.name ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-500' : 'border-gray-200 dark:border-ocean-700 focus:ring-blue-500/50 dark:focus:ring-ocean-400/50 focus:border-blue-400 dark:focus:border-ocean-500'
            ]"
          />
          <div v-if="errors.name" class="text-red-500 dark:text-red-400 text-sm mt-1">
            {{ Array.isArray(errors.name) ? errors.name[0] : errors.name }}
          </div>
        </div>
        <div>
          <label for="register-email" class="block text-sm font-medium text-gray-600 dark:text-ocean-300 mb-1.5">
            Email
          </label>
          <input
            id="register-email"
            v-model="form.email"
            type="email"
            name="email"
            autocomplete="email"
            required
            :class="[
              'w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md bg-white dark:bg-ocean-900/50 text-gray-900 dark:text-ocean-100 placeholder-gray-400 dark:placeholder-ocean-500',
              errors.email ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-500' : 'border-gray-200 dark:border-ocean-700 focus:ring-blue-500/50 dark:focus:ring-ocean-400/50 focus:border-blue-400 dark:focus:border-ocean-500'
            ]"
          />
          <div v-if="errors.email" class="text-red-500 dark:text-red-400 text-sm mt-1">
            {{ Array.isArray(errors.email) ? errors.email[0] : errors.email }}
          </div>
        </div>
        <div>
          <label for="register-password" class="block text-sm font-medium text-gray-600 dark:text-ocean-300 mb-1.5">
            Password
          </label>
          <input
            id="register-password"
            v-model="form.password"
            type="password"
            name="password"
            autocomplete="new-password"
            required
            :class="[
              'w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md bg-white dark:bg-ocean-900/50 text-gray-900 dark:text-ocean-100 placeholder-gray-400 dark:placeholder-ocean-500',
              errors.password ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-500' : 'border-gray-200 dark:border-ocean-700 focus:ring-blue-500/50 dark:focus:ring-ocean-400/50 focus:border-blue-400 dark:focus:border-ocean-500'
            ]"
          />
          <div v-if="errors.password" class="text-red-500 dark:text-red-400 text-sm mt-1">
            {{ Array.isArray(errors.password) ? errors.password[0] : errors.password }}
          </div>
        </div>
        <div>
          <label for="register-password-confirmation" class="block text-sm font-medium text-gray-600 dark:text-ocean-300 mb-1.5">
            Confirm Password
          </label>
          <input
            id="register-password-confirmation"
            v-model="form.password_confirmation"
            type="password"
            name="password_confirmation"
            autocomplete="new-password"
            required
            :class="[
              'w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md bg-white dark:bg-ocean-900/50 text-gray-900 dark:text-ocean-100 placeholder-gray-400 dark:placeholder-ocean-500',
              errors.password_confirmation ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-500' : 'border-gray-200 dark:border-ocean-700 focus:ring-blue-500/50 dark:focus:ring-ocean-400/50 focus:border-blue-400 dark:focus:border-ocean-500'
            ]"
          />
          <div v-if="errors.password_confirmation" class="text-red-500 dark:text-red-400 text-sm mt-1">
            {{ Array.isArray(errors.password_confirmation) ? errors.password_confirmation[0] : errors.password_confirmation }}
          </div>
        </div>
        <div>
          <label for="register-role" class="block text-sm font-medium text-gray-600 dark:text-ocean-300 mb-1.5">
            Role
          </label>
          <AppSelect id="register-role" v-model="form.role" :options="roleOptions" required :disabled="loading" :error="errors.role" />
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
import { useAuthRedirect } from '../composables/useAuthRedirect'
import AppSelect from '../components/AppSelect.vue'
import { roleOptions } from '../utils/selectOptions'

const authStore = useAuthStore()
const { redirectToHomepage } = useAuthRedirect()

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'speaker',
})

const errors = ref({})
const error = ref('')
const loading = ref(false)

// Redirect if already authenticated
// Note: User is already fetched by router's beforeEach guard, so we just check authentication status
onMounted(() => {
  // If authenticated, redirect to appropriate homepage
  if (authStore.isAuthenticated) {
    redirectToHomepage()
  }
})

const handleRegister = async () => {
  error.value = ''
  errors.value = {}
  loading.value = true
  try {
    await authStore.register(form.value)
    
    // Redirect to role-based homepage
    redirectToHomepage()
  } catch (err) {
    // Handle validation errors (422)
    if (err.response?.data?.errors) {
      errors.value = err.response.data.errors
    } else {
      // Fallback to generic message for non-validation errors
      error.value = err.response?.data?.message || 'Registration failed'
    }
  } finally {
    loading.value = false
  }
}
</script>
