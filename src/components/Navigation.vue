<template>
  <nav class="bg-white shadow-lg">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-8">
          <router-link to="/" class="text-xl font-bold text-gray-800">
            Talk Proposals
          </router-link>
          <div v-if="authStore.isAuthenticated" class="flex space-x-4">
            <router-link
              v-if="authStore.isSpeaker"
              to="/proposals"
              class="text-gray-600 hover:text-gray-900"
            >
              My Proposals
            </router-link>
            <router-link
              v-if="authStore.isReviewer"
              to="/review/proposals"
              class="text-gray-600 hover:text-gray-900"
            >
              Review Proposals
            </router-link>
            <router-link
              v-if="authStore.isAdmin"
              to="/admin/proposals"
              class="text-gray-600 hover:text-gray-900"
            >
              Admin Dashboard
            </router-link>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <span v-if="authStore.isAuthenticated" class="text-gray-600">
            {{ authStore.user?.name }} ({{ authStore.user?.role }})
          </span>
          <button
            v-if="authStore.isAuthenticated"
            @click="handleLogout"
            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
          <router-link
            v-else
            to="/login"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Login
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

