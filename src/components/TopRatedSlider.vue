<template>
  <div v-if="proposals.length > 0" class="mb-6 sm:mb-8">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-ocean-400 dark:to-ocean-300 bg-clip-text text-transparent">
        ⭐ Top Rated Proposals
      </h2>
      <div class="flex items-center gap-2">
        <button
          @click="handlePreviousClick"
          class="p-2 rounded-full bg-white dark:bg-ocean-800 shadow-md hover:shadow-lg transition-all hover:scale-110"
          aria-label="Previous slide"
        >
          <svg class="w-5 h-5 text-gray-700 dark:text-ocean-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          @click="handleNextClick"
          class="p-2 rounded-full bg-white dark:bg-ocean-800 shadow-md hover:shadow-lg transition-all hover:scale-110"
          aria-label="Next slide"
        >
          <svg class="w-5 h-5 text-gray-700 dark:text-ocean-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
    
    <div class="relative overflow-hidden rounded-xl w-full">
      <div
        ref="sliderContainer"
        class="flex py-3 transition-transform duration-700 ease-in-out"
        :style="{ 
          transform: `translateX(-${transformValue}%)`
        }"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div
          v-for="proposal in proposals"
          :key="proposal.id"
          class="flex-shrink-0 px-2 sm:px-3"
          :style="{ width: slideWidth }"
        >
          <div
            @click="goToProposal(proposal.id)"
            class="bg-gradient-to-br from-white to-blue-50/50 dark:from-ocean-800 dark:to-ocean-700/50 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-100 dark:border-ocean-600 hover:shadow-xl hover:z-10 transition-all duration-300 cursor-pointer hover:-translate-y-1 relative h-full"
          >
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
              <h3 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-ocean-100 line-clamp-2 flex-1">
                {{ proposal.title }}
              </h3>
              <div class="flex items-center gap-2 shrink-0">
                <div class="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-2 py-0.5 rounded-full shadow-md">
                  <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span class="font-bold text-xs">{{ proposal.average_rating }}</span>
                </div>
                <span class="text-xs text-gray-500 dark:text-ocean-400">({{ proposal.reviews_count }} reviews)</span>
              </div>
            </div>
            <p class="text-gray-600 dark:text-ocean-300 mb-3 line-clamp-2 text-sm sm:text-base">
              {{ proposal.description }}
            </p>
            <div class="flex flex-wrap gap-1.5 mb-3">
              <span
                v-for="tag in proposal.tags"
                :key="tag.id"
                class="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-ocean-700 dark:to-ocean-600 text-blue-800 dark:text-ocean-200 px-2 py-0.5 rounded-full text-xs font-medium shadow-sm"
              >
                {{ tag.name }}
              </span>
            </div>
            <div class="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-ocean-400">
              <span>By {{ proposal.user?.name }}</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(proposal.status)">
                {{ proposal.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Slide Indicators -->
      <div class="flex justify-center gap-2 mt-4">
        <button
          v-for="(_, index) in slideCount"
          :key="index"
          @click="goToSlide(index)"
          :class="[
            'h-2 rounded-full transition-all',
            index === currentIndex
              ? 'w-8 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-ocean-400 dark:to-ocean-500'
              : 'w-2 bg-gray-300 dark:bg-ocean-700 hover:bg-gray-400 dark:hover:bg-ocean-600'
          ]"
          :aria-label="`Go to slide ${index + 1}`"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { proposalsApi } from '../api'

const router = useRouter()
const proposals = ref([])
const currentIndex = ref(0)
const autoSlideInterval = ref(null)
const slidesPerView = ref(1) // Will be updated based on screen size
const sliderContainer = ref(null)
let requestVersion = 0
let resumeTimeout = null
const proposalEvents = ['proposal-submitted', 'proposal-reviewed', 'proposal-status-changed']

// Touch/swipe handling
const touchStartX = ref(0)
const touchEndX = ref(0)
const minSwipeDistance = 50

const updateSlidesPerView = () => {
  const oldValue = slidesPerView.value
  // Responsive: 1 on mobile, 2 on tablet, 3 on desktop
  if (window.innerWidth < 640) {
    slidesPerView.value = 1
  } else if (window.innerWidth < 1024) {
    slidesPerView.value = 2
  } else {
    slidesPerView.value = 3
  }
  // Reset to first slide if slides per view changed to prevent index out of bounds
  if (oldValue !== slidesPerView.value) {
    const newMaxIndex = Math.max(0, Math.ceil(proposals.value.length / slidesPerView.value) - 1)
    if (currentIndex.value > newMaxIndex) {
      currentIndex.value = 0
    }
  }
}

const slideCount = computed(() => {
  if (proposals.value.length === 0) return 0
  return Math.ceil(proposals.value.length / slidesPerView.value)
})

const maxIndex = computed(() => {
  return Math.max(0, slideCount.value - 1)
})

const slideWidth = computed(() => {
  if (slidesPerView.value === 0) return '100%'
  // Each slide should be 100% / slidesPerView of the viewport
  return `${100 / slidesPerView.value}%`
})

const transformValue = computed(() => {
  if (slidesPerView.value === 0) return 0
  // Transform by currentIndex * (100% / slidesPerView) of viewport
  return currentIndex.value * (100 / slidesPerView.value)
})

const fetchTopRated = async () => {
  const version = ++requestVersion
  try {
    const response = await proposalsApi.getTopRated(12) // Get 12 top-rated proposals
    if (version !== requestVersion) return
    const data = response.data.data || response.data
    proposals.value = data.proposals || []
    currentIndex.value = Math.min(currentIndex.value, maxIndex.value)
    // Start auto-slide after proposals are loaded
    if (proposals.value.length > 0) {
      stopAutoSlide() // Stop any existing interval
      startAutoSlide() // Start fresh
    } else {
      stopAutoSlide()
    }
  } catch (error) {}
}

const nextSlide = () => {
  if (currentIndex.value < maxIndex.value) {
    currentIndex.value++
  } else {
    currentIndex.value = 0 // Loop back to start
  }
}

const previousSlide = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    currentIndex.value = maxIndex.value // Loop to end
  }
}

// Handle button clicks - pause auto-slide briefly and restart (forever loop)
const handleNextClick = () => {
  stopAutoSlide()
  nextSlide()
  // Resume auto-slide after a delay (forever loop)
  resumeAutoSlide()
}

const handlePreviousClick = () => {
  stopAutoSlide()
  previousSlide()
  // Resume auto-slide after a delay (forever loop)
  resumeAutoSlide()
}

const goToSlide = (index) => {
  stopAutoSlide()
  currentIndex.value = index
  // Resume auto-slide after a delay (forever loop)
  resumeAutoSlide()
}

const goToProposal = (id) => {
  router.push(`/proposals/${id}`)
}

const getStatusClass = (status) => {
  if (status === 'approved') return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
  if (status === 'rejected') return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
}

const startAutoSlide = () => {
  stopAutoSlide() // Clear any existing interval first
  if (!proposals.value.length) return
  autoSlideInterval.value = setInterval(() => {
    previousSlide() // Rotate to the left (previous slide) - loops forever
  }, 7000) // Auto-advance every 7 seconds (slower)
}

const stopAutoSlide = () => {
  if (autoSlideInterval.value) {
    clearInterval(autoSlideInterval.value)
    autoSlideInterval.value = null
  }
}

const resumeAutoSlide = () => {
  clearTimeout(resumeTimeout)
  resumeTimeout = setTimeout(() => {
    resumeTimeout = null
    startAutoSlide()
  }, 5000)
}

// Touch event handlers for swipe support
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  stopAutoSlide() // Pause auto-slide during interaction
}

const handleTouchMove = (e) => {
  touchEndX.value = e.touches[0].clientX
}

const handleTouchEnd = () => {
  if (!touchStartX.value || !touchEndX.value) return
  
  const distance = touchStartX.value - touchEndX.value
  
  if (Math.abs(distance) > minSwipeDistance) {
    if (distance > 0) {
      // Swiped left - next slide
      nextSlide()
    } else {
      // Swiped right - previous slide
      previousSlide()
    }
  }
  
  // Reset touch values
  touchStartX.value = 0
  touchEndX.value = 0
  
  resumeAutoSlide()
}

onMounted(() => {
  updateSlidesPerView()
  window.addEventListener('resize', updateSlidesPerView)
  proposalEvents.forEach(event => window.addEventListener(event, fetchTopRated))
  fetchTopRated() // This will start auto-slide after data loads
})

onUnmounted(() => {
  requestVersion++
  window.removeEventListener('resize', updateSlidesPerView)
  proposalEvents.forEach(event => window.removeEventListener(event, fetchTopRated))
  clearTimeout(resumeTimeout)
  stopAutoSlide()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
