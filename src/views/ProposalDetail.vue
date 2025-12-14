<template>
  <div class="max-w-4xl mx-auto">
    <div v-if="loading" class="max-w-4xl mx-auto">
      <SkeletonLoader type="proposal-detail" />
    </div>
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 sm:p-6 mb-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-300">Error loading proposal</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-400">{{ error }}</p>
          <button
            @click="fetchProposal"
            class="mt-3 text-sm font-medium text-red-800 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200 underline"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
    <div v-else-if="proposal">
      <div class="bg-white/95 dark:bg-ocean-800/95 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100 dark:border-ocean-700">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-0 mb-4">
          <h1 class="text-2xl sm:text-3xl font-bold flex-1 pr-2 text-gray-800 dark:text-ocean-100">{{ proposal.title }}</h1>
          <span
            :class="statusClasses"
            class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shrink-0"
          >
            {{ proposal.status }}
          </span>
        </div>
        <div class="mb-3 sm:mb-4">
          <p class="text-gray-600 dark:text-ocean-300 text-sm sm:text-base">By {{ proposal.user?.name }}</p>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-ocean-400">
            {{ formatDate(proposal.created_at) }}
          </p>
        </div>
        <div class="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <span
            v-for="tag in proposal.tags"
            :key="tag.id"
            class="bg-blue-100 dark:bg-ocean-700 text-blue-800 dark:text-ocean-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm"
          >
            {{ tag.name }}
          </span>
        </div>
        <div class="mb-3 sm:mb-4">
          <h2 class="text-lg sm:text-xl font-semibold mb-2 text-gray-800 dark:text-ocean-100">Description</h2>
          <p class="text-gray-700 dark:text-ocean-200 whitespace-pre-wrap text-sm sm:text-base">{{ proposal.description }}</p>
        </div>
        <div v-if="proposal.file_path" class="mb-4">
          <button
            @click="downloadFile"
            class="text-blue-600 dark:text-ocean-400 hover:text-blue-800 dark:hover:text-ocean-300 underline bg-transparent border-none cursor-pointer p-0 text-left"
          >
            Download PDF
          </button>
          <div v-if="downloadError" class="mt-2 text-sm text-red-600 dark:text-red-400">
            {{ downloadError }}
          </div>
        </div>
        <div v-if="authStore.isAdmin" class="mt-3 sm:mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-ocean-200 mb-1.5 sm:mb-2">
            Change Status
          </label>
          <select
            v-model="status"
            @change="updateStatus"
            class="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-ocean-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 focus:border-blue-500 dark:focus:border-ocean-500 transition-all shadow-sm hover:shadow-md text-sm sm:text-base bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100"
            :class="{ 'border-red-300 dark:border-red-600 focus:ring-red-500': statusError }"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div v-if="statusError" class="mt-1 text-sm text-red-600 dark:text-red-400">
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

      <ReviewList :reviews="reviews" @edit="handleEditReview" />
      
      <!-- Edit Review Modal -->
      <div v-if="editingReview" class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" @click.self="cancelEditReview">
        <div class="bg-white dark:bg-ocean-800 rounded-xl shadow-xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-ocean-100">Edit Review</h3>
          <form @submit.prevent="handleUpdateReview" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-ocean-200 mb-2">
                Rating *
              </label>
              <select
                v-model="editReviewForm.rating"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-ocean-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100"
              >
                <option value="">Select rating</option>
                <option
                  v-for="rating in ratingOptions"
                  :key="rating.value"
                  :value="rating.value"
                >
                  {{ rating.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-ocean-200 mb-2">
                Comment
              </label>
              <textarea
                v-model="editReviewForm.comment"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 dark:border-ocean-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100 resize-y"
              ></textarea>
            </div>
            <div v-if="editReviewError" class="text-red-600 dark:text-red-400 text-sm">
              {{ editReviewError }}
            </div>
            <div class="flex gap-3">
              <button
                type="submit"
                :disabled="editReviewLoading"
                class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-ocean-500 dark:to-ocean-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-ocean-600 dark:hover:to-ocean-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-sm font-medium disabled:opacity-50"
              >
                {{ editReviewLoading ? 'Updating...' : 'Update Review' }}
              </button>
              <button
                type="button"
                @click="cancelEditReview"
                class="flex-1 bg-gray-300 dark:bg-ocean-700 text-gray-700 dark:text-ocean-200 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-ocean-600 transition-all text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { useRealtime } from '../composables/useRealtime'
import { proposalsApi, reviewsApi } from '../api'
import api from '../api/axios'
import ReviewForm from '../components/ReviewForm.vue'
import ReviewList from '../components/ReviewList.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'

const route = useRoute()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const proposal = ref(null)
const reviews = ref([])
const loading = ref(true)
const reviewLoading = ref(false)
const reviewErrors = ref({})
const status = ref('')
const error = ref('')
const downloadError = ref('')
const statusError = ref('')
const editingReview = ref(null)
const editReviewForm = ref({
  rating: '',
  comment: '',
})
const editReviewLoading = ref(false)
const editReviewError = ref('')
const ratingOptions = ref([])
const { listenToProposal } = useRealtime()

const statusClasses = computed(() => {
  if (!proposal.value) return ''
  const s = proposal.value.status
  if (s === 'approved') return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
  if (s === 'rejected') return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
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
  } catch (error) {}
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

const handleEditReview = (review) => {
  editingReview.value = review
  editReviewForm.value = {
    rating: review.rating.toString(),
    comment: review.comment || '',
  }
  editReviewError.value = ''
}

const cancelEditReview = () => {
  editingReview.value = null
  editReviewForm.value = {
    rating: '',
    comment: '',
  }
  editReviewError.value = ''
}

const handleUpdateReview = async () => {
  if (!editingReview.value) return
  
  editReviewLoading.value = true
  editReviewError.value = ''
  
  try {
    await reviewsApi.update(
      route.params.id,
      editingReview.value.id,
      {
        rating: parseInt(editReviewForm.value.rating),
        comment: editReviewForm.value.comment,
      }
    )
    await fetchReviews()
    cancelEditReview()
  } catch (err) {
    if (err.response?.data?.errors) {
      const errors = err.response.data.errors
      const firstErrorKey = Object.keys(errors)[0]
      editReviewError.value = Array.isArray(errors[firstErrorKey])
        ? errors[firstErrorKey][0]
        : errors[firstErrorKey]
    } else if (err.response?.data?.message) {
      editReviewError.value = err.response.data.message
    } else {
      editReviewError.value = 'Failed to update review. Please try again.'
    }
  } finally {
    editReviewLoading.value = false
  }
}

const fetchRatingOptions = async () => {
  try {
    const response = await reviewsApi.getRatingOptions()
    const data = response.data.data || response.data
    ratingOptions.value = data.ratings || []
  } catch (err) {
    // Fallback to default options if API fails
    ratingOptions.value = [
      { value: 1, label: '1 - Poor' },
      { value: 2, label: '2 - Fair' },
      { value: 3, label: '3 - Good' },
      { value: 4, label: '4 - Very Good' },
      { value: 5, label: '5 - Excellent' },
      { value: 10, label: '10 - Outstanding' },
    ]
  }
}

// Handle status changes from global events
const handleStatusChanged = (event) => {
  const data = event.detail
  if (proposal.value && (proposal.value.id === data.proposal_id || proposal.value.id === data.proposal?.id)) {
    // Update the entire proposal object with the new data
    if (data.proposal) {
      proposal.value = {
        ...proposal.value,
        ...data.proposal,
        status: data.new_status,
      }
    } else {
      proposal.value.status = data.new_status
    }
    status.value = data.new_status
  }
}

onMounted(() => {
  fetchProposal()
  fetchRatingOptions()
  
  // Listen to real-time events for this specific proposal
  if (route.params.id) {
    listenToProposal(route.params.id, {
      onReviewed: () => {
        // Refresh reviews when a new review is added
        fetchReviews()
      },
      onStatusChanged: (data) => {
        // Update proposal with full resource from event
        if (proposal.value && proposal.value.id === data.proposal_id) {
          // Update the entire proposal object with the new data
          proposal.value = {
            ...proposal.value,
            ...data.proposal,
            status: data.new_status,
          }
          status.value = data.new_status
          
          // Show notification
          notificationsStore.push(data.message, 'info', 5000)
        }
      },
    })
  }
  
  // Also listen to global events for status changes
  window.addEventListener('proposal-status-changed', handleStatusChanged)
})

onUnmounted(() => {
  window.removeEventListener('proposal-status-changed', handleStatusChanged)
})
</script>

