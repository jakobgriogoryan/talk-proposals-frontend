<template>
  <div class="max-w-4xl mx-auto">
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading...</div>
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 mb-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-red-800">Error loading proposal</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          <button
            @click="fetchProposal"
            class="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
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
          <button
            @click="downloadFile"
            class="text-blue-600 hover:text-blue-800 underline bg-transparent border-none cursor-pointer p-0 text-left"
          >
            Download PDF
          </button>
          <div v-if="downloadError" class="mt-2 text-sm text-red-600">
            {{ downloadError }}
          </div>
        </div>
        <div v-if="authStore.isAdmin" class="mt-3 sm:mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Change Status
          </label>
          <select
            v-model="status"
            @change="updateStatus"
            class="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            :class="{ 'border-red-300 focus:ring-red-500': statusError }"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div v-if="statusError" class="mt-1 text-sm text-red-600">
            {{ statusError }}
          </div>
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
import api from '../api/axios'
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
const error = ref('')
const downloadError = ref('')
const statusError = ref('')

const statusClasses = computed(() => {
  if (!proposal.value) return ''
  const s = proposal.value.status
  if (s === 'approved') return 'bg-green-100 text-green-800'
  if (s === 'rejected') return 'bg-red-100 text-red-800'
  return 'bg-yellow-100 text-yellow-800'
})

const fetchProposal = async () => {
  error.value = ''
  loading.value = true
  try {
    // Fetch proposal and reviews in parallel for better performance
    const [proposalResponse, reviewsResponse] = await Promise.all([
      proposalsApi.getOne(route.params.id),
      reviewsApi.getForProposal(route.params.id).catch(err => {
        // If reviews fail, just log and continue
        console.error('Error fetching reviews:', err)
        return { data: { data: { reviews: [] } } }
      })
    ])
    
    // Handle new ApiResponse format: { status, message, data: { proposal } }
    const proposalData = proposalResponse.data.data || proposalResponse.data
    proposal.value = proposalData.proposal
    status.value = proposal.value.status
    
    // Handle reviews response
    const reviewsData = reviewsResponse.data.data || reviewsResponse.data
    reviews.value = reviewsData.reviews || []
  } catch (err) {
    console.error('Error fetching proposal:', err)
    // Get user-friendly error message
    let errorMessage = 'Failed to load proposal. Please try again.'
    
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message
    } else if (err.response?.status === 404) {
      errorMessage = 'This proposal could not be found. It may have been deleted or you may not have access to it.'
    } else if (err.response?.status === 403) {
      errorMessage = 'You don\'t have permission to view this proposal.'
    } else if (err.response?.status === 401) {
      errorMessage = 'Please log in to view this proposal.'
    } else if (!err.response) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.'
    } else if (err.message && !err.message.includes('status code')) {
      errorMessage = err.message
    }
    
    error.value = errorMessage
    proposal.value = null
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
  statusError.value = ''
  try {
    const response = await proposalsApi.updateStatus(route.params.id, status.value)
    // Handle new ApiResponse format: { status, message, data: { proposal } }
    const data = response.data.data || response.data
    proposal.value = data.proposal || proposal.value
    proposal.value.status = status.value
  } catch (err) {
    // Toast will be shown automatically by axios interceptor
    let errorMessage = 'Failed to update status. Please try again.'
    
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message
    } else if (err.response?.status === 403) {
      errorMessage = 'You don\'t have permission to change the status of this proposal.'
    } else if (err.response?.status === 404) {
      errorMessage = 'This proposal could not be found.'
    } else if (!err.response) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.'
    }
    
    statusError.value = errorMessage
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

const downloadFile = async () => {
  if (!proposal.value?.file_path) return
  
  downloadError.value = ''
  try {
    // The file_path from the API is already a relative path like /proposals/2/download
    // Axios will automatically prepend the baseURL (/api)
    const response = await api.get(proposal.value.file_path, {
      responseType: 'blob',
    })
    
    // Check if response is actually an error (sometimes errors come as blobs)
    if (response.data.type && response.data.type.includes('application/json')) {
      const text = await response.data.text()
      const errorData = JSON.parse(text)
      throw new Error(errorData.message || 'Failed to download file')
    }
    
    // Create a blob from the response
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    
    // Extract filename from the proposal title or use a default name
    const fileName = proposal.value.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf'
    link.setAttribute('download', fileName)
    
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.error('Error downloading file:', err)
    let errorMessage = 'Failed to download file. Please try again.'
    
    // Try to parse blob error response
    if (err.response?.data && err.response.data instanceof Blob) {
      try {
        const text = await err.response.data.text()
        const errorData = JSON.parse(text)
        errorMessage = errorData.message || errorMessage
      } catch (parseError) {
        // If parsing fails, use default message
      }
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message
    } else if (err.response?.status === 404) {
      errorMessage = 'The file could not be found. It may have been deleted.'
    } else if (err.response?.status === 403) {
      errorMessage = 'You don\'t have permission to download this file.'
    } else if (err.response?.status === 401) {
      errorMessage = 'Please log in to download this file.'
    } else if (!err.response) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.'
    } else if (err.message && !err.message.includes('status code') && !err.message.includes('Request failed')) {
      errorMessage = err.message
    }
    
    downloadError.value = errorMessage
    // Toast will be shown automatically by axios interceptor for non-blob errors
  }
}

onMounted(() => {
  fetchProposal()
})
</script>

