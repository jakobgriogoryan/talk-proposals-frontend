<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h3 class="text-lg font-semibold mb-4">Add Review</h3>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Rating *
        </label>
        <select
          v-model="form.rating"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select rating</option>
          <option value="1">1 - Poor</option>
          <option value="2">2 - Fair</option>
          <option value="3">3 - Good</option>
          <option value="4">4 - Very Good</option>
          <option value="5">5 - Excellent</option>
        </select>
        <div v-if="errors.rating" class="text-red-500 text-sm mt-1">
          {{ errors.rating }}
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Comment
        </label>
        <textarea
          v-model="form.comment"
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
        <div v-if="errors.comment" class="text-red-500 text-sm mt-1">
          {{ errors.comment }}
        </div>
      </div>
      <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
      <button
        type="submit"
        :disabled="loading"
        class="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
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

