<template>
  <div class="bg-white p-4 sm:p-6 rounded-lg shadow-md">
    <h3 class="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Add Review</h3>
    <form @submit.prevent="handleSubmit" class="space-y-3 sm:space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          Rating * <span class="text-gray-500 text-xs">(1-5 or 10)</span>
        </label>
        <select
          v-model="form.rating"
          required
          class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          :class="{ 'border-red-300 focus:ring-red-500': errors.rating }"
        >
          <option value="">Select rating</option>
          <option value="1">1 - Poor</option>
          <option value="2">2 - Fair</option>
          <option value="3">3 - Good</option>
          <option value="4">4 - Very Good</option>
          <option value="5">5 - Excellent</option>
          <option value="10">10 - Outstanding</option>
        </select>
        <p class="text-xs text-gray-500 mt-1">Select a rating from 1 to 5, or 10 for outstanding proposals.</p>
        <div v-if="errors.rating" class="text-red-500 text-sm mt-1">
          {{ errors.rating }}
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          Comment
        </label>
        <textarea
          v-model="form.comment"
          rows="4"
          class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base resize-y"
        ></textarea>
        <div v-if="errors.comment" class="text-red-500 text-sm mt-1">
          {{ errors.comment }}
        </div>
      </div>
      <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
      <button
        type="submit"
        :disabled="loading"
        class="w-full sm:w-auto bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm sm:text-base"
      >
        {{ loading ? 'Submitting...' : 'Submit Review' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

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

