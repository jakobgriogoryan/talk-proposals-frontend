<template>
  <nav class="bg-white shadow-lg">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <router-link to="/" class="text-lg sm:text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
          <span class="hidden sm:inline">Talk Proposals</span>
          <span class="sm:hidden">TP</span>
        </router-link>

        <!-- Desktop Navigation -->
        <div v-if="authStore.isAuthenticated" class="hidden md:flex items-center space-x-6">
          <router-link
            v-if="authStore.isSpeaker"
            to="/proposals"
            class="text-gray-600 hover:text-gray-900 transition-colors"
          >
            My Proposals
          </router-link>
          <router-link
            v-if="authStore.isReviewer"
            to="/review/proposals"
            class="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Review Proposals
          </router-link>
          <router-link
            v-if="authStore.isAdmin"
            to="/admin/proposals"
            class="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Admin Dashboard
          </router-link>
        </div>

        <!-- Desktop User Info & Actions -->
        <div class="hidden md:flex items-center space-x-4">
          <span v-if="authStore.isAuthenticated" class="text-sm text-gray-600">
            <span class="hidden lg:inline">{{ authStore.user?.name }}</span>
            <span class="lg:hidden">{{ authStore.user?.name?.split(' ')[0] }}</span>
            <span class="text-gray-400"> ({{ authStore.user?.role }})</span>
          </span>
          <button
            v-if="authStore.isAuthenticated"
            @click="handleLogout"
            class="bg-red-500 text-white px-3 sm:px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
          >
            Logout
          </button>
          <router-link
            v-else
            to="/login"
            class="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
          >
            Login
          </router-link>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle menu"
        >
          <svg
            v-if="!mobileMenuOpen"
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg
            v-else
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <Transition name="slide-down">
        <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-200 py-4">
          <div v-if="authStore.isAuthenticated" class="space-y-2">
            <router-link
              v-if="authStore.isSpeaker"
              to="/proposals"
              @click="mobileMenuOpen = false"
              class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              My Proposals
            </router-link>
            <router-link
              v-if="authStore.isReviewer"
              to="/review/proposals"
              @click="mobileMenuOpen = false"
              class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              Review Proposals
            </router-link>
            <router-link
              v-if="authStore.isAdmin"
              to="/admin/proposals"
              @click="mobileMenuOpen = false"
              class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              Admin Dashboard
            </router-link>
            <div class="px-4 py-2 text-sm text-gray-600 border-t border-gray-200 mt-2 pt-2">
              {{ authStore.user?.name }} ({{ authStore.user?.role }})
            </div>
            <button
              @click="handleLogout"
              class="w-full text-left px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
          <router-link
            v-else
            to="/login"
            @click="mobileMenuOpen = false"
            class="block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-center"
          >
            Login
          </router-link>
        </div>
      </Transition>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const mobileMenuOpen = ref(false)

const handleLogout = async () => {
  mobileMenuOpen.value = false
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 300px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>

