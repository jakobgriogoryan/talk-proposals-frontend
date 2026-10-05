<template>
  <div class="bg-white/95 dark:bg-ocean-800/95 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100 dark:border-ocean-700">
    <h3 class="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-ocean-100">Add Review</h3>
    <form @submit.prevent="handleSubmit" class="space-y-3 sm:space-y-4">
      <div>
        <label for="review-rating" class="block text-sm font-medium text-gray-700 dark:text-ocean-200 mb-1.5 sm:mb-2">
          Rating *
        </label>
        <AppSelect id="review-rating" v-model="form.rating" :options="ratingOptions" placeholder="Select rating" required :disabled="loading || loadingRatings || !ratingOptions.length" :error="errors.rating" />
        <p class="text-xs text-gray-500 dark:text-ocean-400 mt-1">
          <span v-if="ratingOptions.length > 0">
            Select a rating from {{ ratingOptions.map(r => r.value).join(', ') }}.
          </span>
          <span v-else-if="loadingRatings">Loading rating options...</span>
        </p>
        <p v-if="ratingLoadError" role="alert" class="text-red-500 dark:text-red-400 text-sm mt-1">
          {{ ratingLoadError }}
          <button type="button" @click="fetchRatingOptions" class="underline" :disabled="loadingRatings">Retry</button>
        </p>
        <div v-if="errors.rating" class="text-red-500 dark:text-red-400 text-sm mt-1">
          {{ errors.rating }}
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-ocean-200 mb-1.5 sm:mb-2">
          Comment
        </label>
        <textarea
            v-model="form.comment"
            rows="4"
            class="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-ocean-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 text-sm sm:text-base resize-y bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100"
        ></textarea>
        <div v-if="errors.comment" class="text-red-500 dark:text-red-400 text-sm mt-1">
          {{ errors.comment }}
        </div>
      </div>
      <div v-if="error" class="text-red-500 dark:text-red-400 text-sm">{{ error }}</div>
      <button
          type="submit"
          :disabled="loading || loadingRatings || !ratingOptions.length"
          class="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 dark:from-ocean-500 dark:to-ocean-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-ocean-600 dark:hover:to-ocean-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base font-medium"
      >
        {{ loading ? 'Submitting...' : 'Submit Review' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { reviewsApi } from '../api'
import AppSelect from './AppSelect.vue'

const emit = defineEmits(['submit'])

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
})

const form = ref({
  rating: '',
  comment: '',
})

const error = ref('')
const ratingOptions = ref([])
const loadingRatings = ref(true)
const ratingLoadError = ref('')
let active = true
onUnmounted(() => { active = false })

const fetchRatingOptions = async () => {
  loadingRatings.value = true
  ratingLoadError.value = ''
  try {
    const response = await reviewsApi.getRatingOptions()
    const data = response.data.data || response.data
    if (!active) return
    if (!Array.isArray(data.ratings) || !data.ratings.length) throw new Error('No rating options')
    ratingOptions.value = data.ratings
  } catch (err) {
    if (!active) return
    ratingOptions.value = []
    ratingLoadError.value = 'Unable to load rating options. Please retry.'
  } finally {
    if (active) loadingRatings.value = false
  }
}

onMounted(() => {
  fetchRatingOptions()
})

const handleSubmit = () => {
  error.value = ''
  const rating = Number(form.value.rating)
  if (props.loading || loadingRatings.value || !ratingOptions.value.some(option => Number(option.value) === rating)) {
    error.value = 'Please select a rating'
    return
  }
  emit('submit', {
    rating,
    comment: form.value.comment,
  })
}
</script>
