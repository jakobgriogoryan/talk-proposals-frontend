<template>
  <div class="max-w-4xl mx-auto">
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading...</div>
    <div v-else-if="proposal">
      <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-0 mb-4">
          <h1 class="text-2xl sm:text-3xl font-bold flex-1 pr-2">{{ proposal.title }}</h1>
          <span
            :class="statusClasses"
            class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shrink-0"
          >
            {{ proposal.status }}
          </span>
        </div>
        <div class="mb-3 sm:mb-4">
          <p class="text-gray-600 text-sm sm:text-base">By {{ proposal.user?.name }}</p>
          <p class="text-xs sm:text-sm text-gray-500">
            {{ formatDate(proposal.created_at) }}
          </p>
        </div>
        <div class="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <span
            v-for="tag in proposal.tags"
            :key="tag.id"
            class="bg-blue-100 text-blue-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm"
          >
            {{ tag.name }}
          </span>
        </div>
        <div class="mb-3 sm:mb-4">
          <h2 class="text-lg sm:text-xl font-semibold mb-2">Description</h2>
          <p class="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{{ proposal.description }}</p>
        </div>
        <div v-if="proposal.file_path" class="mb-4">
          <a
            :href="proposal.file_path"
            target="_blank"
            class="text-blue-600 hover:text-blue-800 underline"
          >
            Download PDF
          </a>
        </div>
        <div v-if="authStore.isAdmin" class="mt-3 sm:mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Change Status
          </label>
          <select
            v-model="status"
            @change="updateStatus"
            class="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div v-if="authStore.isReviewer" class="mb-6">
        <ReviewForm
          :loading="reviewLoading"
          :errors="reviewErrors"
          @submit="handleReviewSubmit"
        />
      </div>

      <ReviewList :reviews="reviews" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { proposalsApi, reviewsApi } from '../api'
import ReviewForm from '../components/ReviewForm.vue'
import ReviewList from '../components/ReviewList.vue'

const route = useRoute()
const authStore = useAuthStore()
const proposal = ref(null)
const reviews = ref([])
const loading = ref(true)
const reviewLoading = ref(false)
const reviewErrors = ref({})
const status = ref('')

const statusClasses = computed(() => {
  if (!proposal.value) return ''
  const s = proposal.value.status
  if (s === 'approved') return 'bg-green-100 text-green-800'
  if (s === 'rejected') return 'bg-red-100 text-red-800'
  return 'bg-yellow-100 text-yellow-800'
})

const fetchProposal = async () => {
  try {
    const response = await proposalsApi.getOne(route.params.id)
    // Handle new ApiResponse format: { status, message, data: { proposal } }
    const data = response.data.data || response.data
    proposal.value = data.proposal
    status.value = proposal.value.status
    await fetchReviews()
  } catch (error) {
    console.error('Error fetching proposal:', error)
  } finally {
    loading.value = false
  }
}

const fetchReviews = async () => {
  try {
    const response = await reviewsApi.getForProposal(route.params.id)
    // Handle new ApiResponse format: { status, message, data: { reviews } }
    const data = response.data.data || response.data
    reviews.value = data.reviews
  } catch (error) {
    console.error('Error fetching reviews:', error)
  }
}

const handleReviewSubmit = async (reviewData) => {
  reviewLoading.value = true
  reviewErrors.value = {}
  try {
    await reviewsApi.create(route.params.id, reviewData)
    await fetchReviews()
  } catch (error) {
    if (error.response?.data?.errors) {
      reviewErrors.value = error.response.data.errors
    }
    // Toast will be shown automatically by axios interceptor
  } finally {
    reviewLoading.value = false
  }
}

const updateStatus = async () => {
  try {
    const response = await proposalsApi.updateStatus(route.params.id, status.value)
    // Handle new ApiResponse format: { status, message, data: { proposal } }
    const data = response.data.data || response.data
    proposal.value = data.proposal || proposal.value
    proposal.value.status = status.value
  } catch (error) {
    // Toast will be shown automatically by axios interceptor
    status.value = proposal.value.status
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(() => {
  fetchProposal()
})
</script>

