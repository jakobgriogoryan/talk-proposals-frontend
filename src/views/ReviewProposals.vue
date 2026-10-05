<template>
  <div>
    <h1 class="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-ocean-400 dark:to-ocean-300 bg-clip-text text-transparent">Proposals for Review</h1>

    <TopRatedSlider />

    <ProposalFilters
      :filters="filters"
      :tags="tags"
      :show-status-filter="true"
      :proposals-count="pagination?.total || proposals.length"
      @update:filters="updateFilters"
    />
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <SkeletonLoader
          v-for="i in 6"
          :key="i"
          type="proposal-card"
      />
    </div>
    <div v-else-if="proposals.length === 0" class="text-center py-8 sm:py-12 text-gray-500 dark:text-ocean-400">
      <p class="text-base sm:text-lg">No proposals found.</p>
    </div>
    <div
      v-else
      ref="scrollContainer"
      class="overflow-auto"
      style="height: calc(100vh - 400px); min-height: 400px;"
    >
      <div
        :style="{
          height: `${Math.max(
            virtualizer?.getTotalSize() ?? 0,
            rowCount * 250 + 32
          )}px`,
          width: '100%',
          position: 'relative',
        }"
      >
        <div
          v-for="virtualRow in visibleRows"
          :key="virtualRow.key"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-1">
            <div
              v-for="proposal in virtualRow.items"
              :key="proposal.id"
              @click="goToDetail(proposal.id)"
              class="cursor-pointer"
            >
              <ProposalCard :proposal="proposal" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pagination && pagination.last_page > 1" class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <!-- Page info -->
      <div class="text-sm text-gray-600 dark:text-ocean-300">
        Showing {{ paginationInfo.from }} to {{ paginationInfo.to }} of {{ pagination.total }} results
      </div>

      <!-- Pagination controls -->
      <nav class="flex items-center gap-1" aria-label="Pagination">
        <!-- Previous button -->
        <button
          @click="goToPage(pagination.current_page - 1)"
          :disabled="pagination.current_page === 1"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            pagination.current_page === 1
              ? 'bg-gray-100 dark:bg-ocean-800 text-gray-400 dark:text-ocean-500 cursor-not-allowed'
              : 'bg-gray-200 dark:bg-ocean-700 text-gray-700 dark:text-ocean-200 hover:bg-gray-300 dark:hover:bg-ocean-600 hover:shadow-sm'
          ]"
          aria-label="Go to previous page"
        >
          <span class="sr-only">Previous</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Page numbers -->
        <template v-for="(item, index) in paginationPages" :key="`page-${index}-${item}`">
          <button
            v-if="item !== 'ellipsis'"
            @click="goToPage(item)"
            :class="[
              'min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-all',
              item === pagination.current_page
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-ocean-500 dark:to-ocean-600 text-white shadow-md cursor-default'
                : 'bg-gray-200 dark:bg-ocean-700 text-gray-700 dark:text-ocean-200 hover:bg-gray-300 dark:hover:bg-ocean-600 hover:shadow-sm'
            ]"
            :aria-label="`Go to page ${item}`"
            :aria-current="item === pagination.current_page ? 'page' : undefined"
          >
            {{ item }}
          </button>
          <span
            v-else
            class="px-2 text-gray-500 dark:text-ocean-400 text-sm"
            aria-hidden="true"
          >
            ...
          </span>
        </template>

        <!-- Next button -->
        <button
          @click="goToPage(pagination.current_page + 1)"
          :disabled="pagination.current_page === pagination.last_page"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            pagination.current_page === pagination.last_page
              ? 'bg-gray-100 dark:bg-ocean-800 text-gray-400 dark:text-ocean-500 cursor-not-allowed'
              : 'bg-gray-200 dark:bg-ocean-700 text-gray-700 dark:text-ocean-200 hover:bg-gray-300 dark:hover:bg-ocean-600 hover:shadow-sm'
          ]"
          aria-label="Go to next page"
        >
          <span class="sr-only">Next</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useWindowSize } from '@vueuse/core'
import { proposalsApi, tagsApi } from '../api'
import { useProposalList } from '../composables/useProposalList'
import ProposalCard from '../components/ProposalCard.vue'
import ProposalFilters from '../components/ProposalFilters.vue'
import TopRatedSlider from '../components/TopRatedSlider.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'

const router = useRouter()
const tags = ref([])
const { proposals, loading, filters, pagination, fetchProposals, updateFilters,
  goToPage, paginationPages, paginationInfo } = useProposalList(proposalsApi.getForReview)
const scrollContainer = ref(null)

// Virtual scrolling setup - use useWindowSize for reactive columns
const { width: windowWidth } = useWindowSize()

const columns = computed(() => {
  if (windowWidth.value >= 1024) return 3
  if (windowWidth.value >= 640) return 2
  return 1
})

const rowCount = computed(() => Math.ceil(proposals.value.length / columns.value))
const isVirtualizerEnabled = computed(() => !!scrollContainer.value && proposals.value.length > 0)

const virtualizer = useVirtualizer({
  count: rowCount,
  getScrollElement: () => scrollContainer.value,
  estimateSize: () => 250,
  overscan: 2,
  paddingStart: 12,
  paddingEnd: 20,
  enabled: isVirtualizerEnabled,
})

const getRowItems = (rowIndex) => {
  const startIndex = rowIndex * columns.value
  return proposals.value.slice(startIndex, startIndex + columns.value)
}

const visibleRows = computed(() => {
  // Early return if prerequisites not met
  if (proposals.value.length === 0 || !scrollContainer.value) {
    return []
  }
  
  // Check if virtualizer is ready
  if (!virtualizer.value) {
    return []
  }
  
  try {
    const items = virtualizer.value.getVirtualItems()
    // If virtualizer returns empty but we have data, it might not be initialized yet
    // Return fallback to ensure content is shown
    if (!items || items.length === 0) {
      if (rowCount.value > 0 && scrollContainer.value) {
        // Return all rows as fallback (non-virtualized) - this ensures content is visible
        return Array.from({ length: rowCount.value }, (_, index) => ({
          key: `row-${index}`,
          index,
          start: 12 + index * 250,
          size: 250,
          items: getRowItems(index),
        }))
      }
      return []
    }
    return items.map(virtualRow => ({
      ...virtualRow,
      items: getRowItems(virtualRow.index),
    }))
  } catch (error) {
    console.warn('Virtualizer error:', error)
    // Fallback to non-virtualized rendering
    if (rowCount.value > 0 && scrollContainer.value) {
      return Array.from({ length: rowCount.value }, (_, index) => ({
        key: `row-${index}`,
        index,
        start: 12 + index * 250,
        size: 250,
        items: getRowItems(index),
      }))
    }
    return []
  }
})

// Update virtualizer when proposals or columns change
watch([() => proposals.value.length, columns, scrollContainer], async () => {
  // Wait for DOM to update
  await nextTick()
  // Force virtualizer to recalculate
  if (virtualizer.value && scrollContainer.value && proposals.value.length > 0) {
    try {
      // Force a recalculation by measuring and scrolling
      virtualizer.value.measure()
      // Ensure the virtualizer knows about the container
      if (virtualizer.value.getVirtualItems().length === 0 && rowCount.value > 0) {
        // Force scroll to trigger recalculation
        scrollContainer.value.scrollTop = 0
        await nextTick()
        virtualizer.value.measure()
      }
    } catch (e) {
      // Ignore errors during measurement
    }
  }
}, { immediate: false })

// Real-time event handlers
const handleProposalSubmitted = () => {
  fetchProposals(pagination.value?.current_page || 1)
}

const handleProposalReviewed = () => {
  fetchProposals(pagination.value?.current_page || 1)
}

const handleProposalStatusChanged = () => {
  // Broadcast payloads are partial; reload to honor the active filters.
  fetchProposals(pagination.value?.current_page || 1)
}

const fetchTags = async () => {
  try {
    const response = await tagsApi.getAll()
    // Handle new ApiResponse format: { status, message, data: { tags } }
    const data = response.data.data || response.data
    tags.value = data.tags
  } catch (error) {}
}

const goToDetail = (id) => {
  router.push(`/proposals/${id}`)
}

onMounted(async () => {
  window.addEventListener('proposal-submitted', handleProposalSubmitted)
  window.addEventListener('proposal-reviewed', handleProposalReviewed)
  window.addEventListener('proposal-status-changed', handleProposalStatusChanged)
  window.addEventListener('realtime-resynced', handleProposalStatusChanged)
  window.addEventListener('proposal-updated', handleProposalStatusChanged)
  window.addEventListener('proposal-deleted', handleProposalStatusChanged)
  window.addEventListener('review-updated', handleProposalStatusChanged)
  fetchProposals()
  fetchTags()
  
  // Wait for DOM to be ready, then ensure virtualizer is initialized
  await nextTick()
  // Wait for data to load
  await nextTick()
  
  if (scrollContainer.value && virtualizer.value && proposals.value.length > 0) {
    try {
      // Force initial measurement
      virtualizer.value.measure()
      // If still empty, scroll to trigger
      if (virtualizer.value.getVirtualItems().length === 0) {
        scrollContainer.value.scrollTop = 0
        await nextTick()
        virtualizer.value.measure()
      }
    } catch (e) {
      // Ignore initialization errors
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('proposal-submitted', handleProposalSubmitted)
  window.removeEventListener('proposal-reviewed', handleProposalReviewed)
  window.removeEventListener('proposal-status-changed', handleProposalStatusChanged)
  window.removeEventListener('realtime-resynced', handleProposalStatusChanged)
  window.removeEventListener('proposal-updated', handleProposalStatusChanged)
  window.removeEventListener('proposal-deleted', handleProposalStatusChanged)
  window.removeEventListener('review-updated', handleProposalStatusChanged)
})
</script>
