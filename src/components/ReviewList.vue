<template>
  <div class="space-y-3 sm:space-y-4">
    <h3 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-ocean-100">Reviews ({{ reviews.length }})</h3>
    <div v-if="reviews.length === 0" class="text-gray-500 dark:text-ocean-400 text-sm sm:text-base">
      No reviews yet.
    </div>
    <div
        v-else
        ref="scrollContainer"
        class="overflow-auto"
        :style="{
          maxHeight: '600px',
          height: reviews.length >= 10 ? '600px' : 'auto',
        }"
    >
      <!-- For small lists (< 10), don't use virtual scrolling -->
      <template v-if="reviews.length < 10">
        <div
            v-for="review in reviews"
            :key="review.id"
            class="bg-white/95 dark:bg-ocean-800/95 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-md border-l-4 hover:shadow-lg transition-all duration-300 mb-3 sm:mb-4"
            :class="getRatingColor(review.rating)"
        >
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 sm:gap-0 mb-2">
            <div class="flex-1">
              <div class="font-medium text-sm sm:text-base text-gray-800 dark:text-ocean-100">{{ review.reviewer?.name }}</div>
              <div class="text-xs sm:text-sm text-gray-500 dark:text-ocean-400">
                {{ formatDate(review.created_at) }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="text-base sm:text-lg font-semibold shrink-0 text-gray-800 dark:text-ocean-100">
                {{ review.rating }}{{ review.rating === 10 ? '' : '/5' }}
              </div>
              <button
                  v-if="isAdmin"
                  @click="$emit('edit', review)"
                  class="p-1.5 text-blue-600 dark:text-ocean-400 hover:text-blue-800 dark:hover:text-ocean-300 hover:bg-blue-50 dark:hover:bg-ocean-700 rounded transition-colors"
                  aria-label="Edit review"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
          <p v-if="review.comment" class="text-gray-700 dark:text-ocean-200 mt-2 text-sm sm:text-base whitespace-pre-wrap">
            {{ review.comment }}
          </p>
        </div>
      </template>
      <!-- For larger lists, use virtual scrolling -->
      <template v-else>
        <div
            :style="{
            height: `${Math.max(
              virtualizer.value?.getTotalSize() ?? 0,
              props.reviews.length * 150
            )}px`,
            width: '100%',
            position: 'relative',
            minHeight: `${props.reviews.length * 150}px`,
          }"
        >
          <template v-if="visibleItems.length > 0">
            <div
                v-for="virtualItem in visibleItems"
                :key="virtualItem.key"
                :data-index="virtualItem.index"
                :style="{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }"
            >
              <div
                  class="bg-white/95 dark:bg-ocean-800/95 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-md border-l-4 hover:shadow-lg transition-all duration-300 mb-3 sm:mb-4"
                  :class="getRatingColor(reviews[virtualItem.index].rating)"
              >
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 sm:gap-0 mb-2">
                  <div class="flex-1">
                    <div class="font-medium text-sm sm:text-base text-gray-800 dark:text-ocean-100">{{ reviews[virtualItem.index].reviewer?.name }}</div>
                    <div class="text-xs sm:text-sm text-gray-500 dark:text-ocean-400">
                      {{ formatDate(reviews[virtualItem.index].created_at) }}
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="text-base sm:text-lg font-semibold shrink-0 text-gray-800 dark:text-ocean-100">
                      {{ reviews[virtualItem.index].rating }}{{ reviews[virtualItem.index].rating === 10 ? '' : '/5' }}
                    </div>
                    <button
                        v-if="isAdmin"
                        @click="$emit('edit', reviews[virtualItem.index])"
                        class="p-1.5 text-blue-600 dark:text-ocean-400 hover:text-blue-800 dark:hover:text-ocean-300 hover:bg-blue-50 dark:hover:bg-ocean-700 rounded transition-colors"
                        aria-label="Edit review"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p v-if="reviews[virtualItem.index].comment" class="text-gray-700 dark:text-ocean-200 mt-2 text-sm sm:text-base whitespace-pre-wrap">
                  {{ reviews[virtualItem.index].comment }}
                </p>
              </div>
            </div>
          </template>
          <template v-else>
            <!-- Fallback: show all reviews if virtualizer fails -->
            <div
                v-for="review in reviews"
                :key="review.id"
                class="bg-white/95 dark:bg-ocean-800/95 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-md border-l-4 hover:shadow-lg transition-all duration-300 mb-3 sm:mb-4"
                :class="getRatingColor(review.rating)"
            >
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 sm:gap-0 mb-2">
                <div class="flex-1">
                  <div class="font-medium text-sm sm:text-base text-gray-800 dark:text-ocean-100">{{ review.reviewer?.name }}</div>
                  <div class="text-xs sm:text-sm text-gray-500 dark:text-ocean-400">
                    {{ formatDate(review.created_at) }}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="text-base sm:text-lg font-semibold shrink-0 text-gray-800 dark:text-ocean-100">
                    {{ review.rating }}{{ review.rating === 10 ? '' : '/5' }}
                  </div>
                  <button
                      v-if="isAdmin"
                      @click="$emit('edit', review)"
                      class="p-1.5 text-blue-600 dark:text-ocean-400 hover:text-blue-800 dark:hover:text-ocean-300 hover:bg-blue-50 dark:hover:bg-ocean-700 rounded transition-colors"
                      aria-label="Edit review"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
              <p v-if="review.comment" class="text-gray-700 dark:text-ocean-200 mt-2 text-sm sm:text-base whitespace-pre-wrap">
                {{ review.comment }}
              </p>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  reviews: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['edit'])

const authStore = useAuthStore()
const isAdmin = authStore.isAdmin
const scrollContainer = ref(null)

// Virtual scrolling for reviews
const reviewCount = computed(() => props.reviews.length)
const isVirtualizerEnabled = computed(() => !!scrollContainer.value && props.reviews.length >= 10)

const virtualizer = useVirtualizer({
  count: reviewCount,
  getScrollElement: () => scrollContainer.value,
  estimateSize: () => 150, // Estimated height per review (increased for better spacing)
  overscan: 5,
  enabled: isVirtualizerEnabled,
})

// Computed property for visible items with fallback
const visibleItems = computed(() => {
  // For small lists, return empty to use direct rendering
  if (props.reviews.length < 10) {
    return []
  }
  
  if (props.reviews.length === 0 || !scrollContainer.value) {
    return []
  }
  
  if (!virtualizer.value) {
    return []
  }
  
  try {
    const items = virtualizer.value.getVirtualItems()
    if (!items || items.length === 0) {
      // Fallback: return all items as non-virtualized
      if (props.reviews.length > 0) {
        return props.reviews.map((_, index) => ({
          key: `review-${index}`,
          index,
          start: index * 150,
          size: 150,
        }))
      }
      return []
    }
    return items
  } catch (error) {
    // Fallback on error
    if (props.reviews.length > 0) {
      return props.reviews.map((_, index) => ({
        key: `review-${index}`,
        index,
        start: index * 150,
        size: 150,
      }))
    }
    return []
  }
})

// Update virtualizer when reviews change
watch([reviewCount, scrollContainer], async () => {
  if (props.reviews.length < 10) {
    return // Skip for small lists
  }
  
  await nextTick()
  if (virtualizer.value && scrollContainer.value && props.reviews.length >= 10) {
    try {
      // Force recalculation - virtualizer will handle the rest
      virtualizer.value.measure()
    } catch (e) {
      // Ignore errors - fallback rendering will handle it
    }
  }
}, { immediate: false })

const getRatingColor = (rating) => {
  if (rating === 10) return 'border-purple-500 dark:border-purple-400'
  if (rating >= 4) return 'border-green-500 dark:border-green-400'
  if (rating >= 3) return 'border-yellow-500 dark:border-yellow-400'
  return 'border-red-500 dark:border-red-400'
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

// Initialize virtualizer after mount
onMounted(async () => {
  if (props.reviews.length < 10) {
    return // Skip for small lists
  }
  
  await nextTick()
  
  if (scrollContainer.value && virtualizer.value && props.reviews.length >= 10) {
    try {
      // Force initial measurement - virtualizer will calculate sizes
      virtualizer.value.measure()
    } catch (e) {
      // Ignore errors - fallback rendering will handle it
    }
  }
})
</script>
