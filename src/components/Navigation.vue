<template>
  <nav class="bg-white/95 dark:bg-ocean-900/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50 dark:border-ocean-700/50 sticky top-0 z-40">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <router-link to="/" class="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-ocean-400 dark:to-ocean-300 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-900 dark:hover:from-ocean-300 dark:hover:to-ocean-200 transition-all">
          <span class="hidden sm:inline">Talk Proposals</span>
          <span class="sm:hidden">TP</span>
        </router-link>

        <!-- Desktop Navigation -->
        <div v-if="authStore.isAuthenticated" class="hidden md:flex items-center space-x-6">
          <router-link
            v-if="authStore.isSpeaker"
            to="/proposals"
            class="text-gray-600 dark:text-ocean-200 hover:text-blue-600 dark:hover:text-ocean-300 font-medium transition-all hover:scale-105"
          >
            My Proposals
          </router-link>
          <router-link
            v-if="authStore.isReviewer"
            to="/review/proposals"
            class="text-gray-600 dark:text-ocean-200 hover:text-blue-600 dark:hover:text-ocean-300 font-medium transition-all hover:scale-105"
          >
            Review Proposals
          </router-link>
          <router-link
            v-if="authStore.isAdmin"
            to="/admin/proposals"
            class="text-gray-600 dark:text-ocean-200 hover:text-blue-600 dark:hover:text-ocean-300 font-medium transition-all hover:scale-105"
          >
            Admin Dashboard
          </router-link>
        </div>

        <!-- Desktop User Info & Actions -->
        <div class="hidden md:flex items-center space-x-4">
          <!-- Theme Toggle -->
          <button
            @click="themeStore.toggleTheme"
            class="p-2 rounded-lg bg-gray-100 dark:bg-ocean-800 text-gray-700 dark:text-ocean-200 hover:bg-gray-200 dark:hover:bg-ocean-700 transition-all"
            aria-label="Toggle theme"
          >
            <svg v-if="themeStore.isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
          <span v-if="authStore.isAuthenticated" class="text-sm text-gray-600 dark:text-ocean-200">
            <span class="hidden lg:inline">{{ authStore.user?.name }}</span>
            <span class="lg:hidden">{{ authStore.user?.name?.split(' ')[0] }}</span>
            <span class="text-gray-400 dark:text-ocean-400"> ({{ authStore.user?.role }})</span>
          </span>
          <button
            v-if="authStore.isAuthenticated"
            @click="handleLogout"
            class="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-sm font-medium"
          >
            Logout
          </button>
          <router-link
            v-else
            to="/login"
            class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-sm font-medium"
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
              class="block px-4 py-2 text-gray-600 dark:text-ocean-200 hover:bg-gray-50 dark:hover:bg-ocean-700 rounded-md transition-colors"
            >
              My Proposals
            </router-link>
            <router-link
              v-if="authStore.isReviewer"
              to="/review/proposals"
              @click="mobileMenuOpen = false"
              class="block px-4 py-2 text-gray-600 dark:text-ocean-200 hover:bg-gray-50 dark:hover:bg-ocean-700 rounded-md transition-colors"
            >
              Review Proposals
            </router-link>
            <router-link
              v-if="authStore.isAdmin"
              to="/admin/proposals"
              @click="mobileMenuOpen = false"
              class="block px-4 py-2 text-gray-600 dark:text-ocean-200 hover:bg-gray-50 dark:hover:bg-ocean-700 rounded-md transition-colors"
            >
              Admin Dashboard
            </router-link>
            <div class="px-4 py-2 text-sm text-gray-600 dark:text-ocean-200 border-t border-gray-200 dark:border-ocean-700 mt-2 pt-2">
              {{ authStore.user?.name }} ({{ authStore.user?.role }})
            </div>
            <button
              @click="themeStore.toggleTheme"
              class="w-full text-left px-4 py-2 text-gray-600 dark:text-ocean-200 hover:bg-gray-50 dark:hover:bg-ocean-700 rounded-md transition-colors flex items-center gap-2"
            >
              <svg v-if="themeStore.isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              {{ themeStore.isDark ? 'Light Mode' : 'Dark Mode' }}
            </button>
            <button
              @click="handleLogout"
              class="w-full text-left px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
          <div v-else class="space-y-2">
            <button
              @click="themeStore.toggleTheme"
              class="w-full text-left px-4 py-2 text-gray-600 dark:text-ocean-200 hover:bg-gray-50 dark:hover:bg-ocean-700 rounded-md transition-colors flex items-center gap-2"
            >
              <svg v-if="themeStore.isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              {{ themeStore.isDark ? 'Light Mode' : 'Dark Mode' }}
            </button>
            <router-link
              to="/login"
              @click="mobileMenuOpen = false"
              class="block px-4 py-2 bg-blue-500 dark:bg-ocean-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-ocean-500 transition-colors text-center"
            >
              Login
            </router-link>
          </div>
        </div>
      </Transition>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const themeStore = useThemeStore()
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

