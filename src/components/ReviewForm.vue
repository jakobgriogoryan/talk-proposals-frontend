<template>
  <div class="bg-white/95 dark:bg-ocean-800/95 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100 dark:border-ocean-700">
    <h3 class="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-ocean-100">Add Review</h3>
    <form @submit.prevent="handleSubmit" class="space-y-3 sm:space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-ocean-200 mb-1.5 sm:mb-2">
          Rating *
        </label>
        <select
            v-model="form.rating"
            required
            class="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-ocean-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 focus:border-blue-500 dark:focus:border-ocean-500 transition-all shadow-sm hover:shadow-md text-sm sm:text-base bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100"
            :class="{ 'border-red-300 dark:border-red-600 focus:ring-red-500': errors.rating }"
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
        <p class="text-xs text-gray-500 dark:text-ocean-400 mt-1">
          <span v-if="ratingOptions.length > 0">
            Select a rating from {{ ratingOptions.map(r => r.value).join(', ') }}.
          </span>
          <span v-else>Loading rating options...</span>
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
          :disabled="loading"
          class="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 dark:from-ocean-500 dark:to-ocean-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-ocean-600 dark:hover:to-ocean-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base font-medium"
      >
        {{ loading ? 'Submitting...' : 'Submit Review' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { reviewsApi } from '../api'

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

onMounted(() => {
  fetchRatingOptions()
})

const handleSubmit = () => {
  error.value = ''
  if (!form.value.rating) {
    error.value = 'Please select a rating'
    return
  }
  emit('submit', {
    rating: parseInt(form.value.rating),
    comment: form.value.comment,
  })
}
</script>

