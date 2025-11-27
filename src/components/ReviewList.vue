<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold">Reviews ({{ reviews.length }})</h3>
    <div v-if="reviews.length === 0" class="text-gray-500">
      No reviews yet.
    </div>
    <div
      v-for="review in reviews"
      :key="review.id"
      class="bg-white p-4 rounded-lg shadow-sm border-l-4"
      :class="getRatingColor(review.rating)"
    >
      <div class="flex justify-between items-start mb-2">
        <div>
          <div class="font-medium">{{ review.reviewer?.name }}</div>
          <div class="text-sm text-gray-500">
            {{ formatDate(review.created_at) }}
          </div>
        </div>
        <div class="text-lg font-semibold">
          {{ review.rating }}/5
        </div>
      </div>
      <p v-if="review.comment" class="text-gray-700 mt-2">
        {{ review.comment }}
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  reviews: {
    type: Array,
    default: () => [],
  },
})

const getRatingColor = (rating) => {
  if (rating >= 4) return 'border-green-500'
  if (rating >= 3) return 'border-yellow-500'
  return 'border-red-500'
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
</script>

