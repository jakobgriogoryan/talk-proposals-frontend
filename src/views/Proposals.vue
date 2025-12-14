<template>
  <div>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
      <h1 class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-ocean-400 dark:to-ocean-300 bg-clip-text text-transparent">My Proposals</h1>
      <router-link
        to="/proposals/new"
        class="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 dark:from-ocean-500 dark:to-ocean-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-ocean-600 dark:hover:to-ocean-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-center text-sm sm:text-base font-medium"
      >
        + New Proposal
      </router-link>
    </div>

    <TopRatedSlider />

    <ProposalFilters
      :filters="filters"
      :tags="tags"
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
            virtualizer.value?.getTotalSize() ?? 0,
            rowCount * 250
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
            <ProposalCard
              v-for="proposal in virtualRow.items"
              :key="proposal.id"
              v-memo="[proposal.id, proposal.status, proposal.title]"
              :proposal="proposal"
              :show-actions="true"
              @delete="handleDelete"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="pagination && pagination.last_page > 1" class="mt-6 flex flex-wrap justify-center gap-2">
      <button
        v-for="page in pagination.last_page"
        :key="page"
        @click="goToPage(page)"
        :class="[
          'px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base transition-all font-medium',
          page === pagination.current_page
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-ocean-500 dark:to-ocean-600 text-white shadow-md'
            : 'bg-gray-200 dark:bg-ocean-700 text-gray-700 dark:text-ocean-200 hover:bg-gray-300 dark:hover:bg-ocean-600 hover:shadow-sm transform hover:scale-105'
        ]"
      >
        {{ page }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useWindowSize } from '@vueuse/core'
import { proposalsApi, tagsApi } from '../api'
import ProposalCard from '../components/ProposalCard.vue'
import ProposalFilters from '../components/ProposalFilters.vue'
import TopRatedSlider from '../components/TopRatedSlider.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'

const proposals = ref([])
const tags = ref([])
const loading = ref(false)
const filters = ref({
  search: '',
  tags: [],
  status: '',
})
const pagination = ref(null)
const scrollContainer = ref(null)

// Virtual scrolling setup - use useWindowSize for reactive columns
const { width: windowWidth } = useWindowSize()

const columns = computed(() => {
  // Responsive columns based on viewport
  if (windowWidth.value >= 1024) return 3 // lg
  if (windowWidth.value >= 640) return 2  // sm
  return 1 // mobile
})

const rowCount = computed(() => Math.ceil(proposals.value.length / columns.value))
const isVirtualizerEnabled = computed(() => !!scrollContainer.value && proposals.value.length > 0)

const virtualizer = useVirtualizer({
  count: rowCount,
  getScrollElement: () => scrollContainer.value,
  estimateSize: () => 250, // Estimated height per row
  overscan: 2,
  enabled: isVirtualizerEnabled,
})

// Get items for a specific row
const getRowItems = (rowIndex) => {
  const startIndex = rowIndex * columns.value
  return proposals.value.slice(startIndex, startIndex + columns.value)
}

// Get visible rows
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
          start: index * 250,
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
        start: index * 250,
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
      // Force a recalculation by measuring
      virtualizer.value.measure()
      // If still empty, scroll to trigger recalculation
      if (virtualizer.value.getVirtualItems().length === 0 && rowCount.value > 0) {
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
const handleProposalSubmitted = (event) => {
  // Refresh proposals list when a new proposal is submitted
  fetchProposals(pagination.value?.current_page || 1)
}

const handleProposalStatusChanged = (event) => {
  // Update proposal status in the list if it exists
  const data = event.detail
  const proposalIndex = proposals.value.findIndex(p => p.id === data.proposal_id || p.id === data.proposal?.id)
  if (proposalIndex !== -1 && data.proposal) {
    // Update the entire proposal object with the new data from the event
    proposals.value[proposalIndex] = {
      ...proposals.value[proposalIndex],
      ...data.proposal,
      status: data.new_status,
    }
  } else {
    // If not in current page, refresh to get updated list
    fetchProposals(pagination.value?.current_page || 1)
  }
}

const fetchProposals = async (page = 1) => {
  loading.value = true
  try {
    const rawParams = {
      page,
      ...filters.value,
    }

    // Only send params that actually have a value
    const params = {}
    Object.entries(rawParams).forEach(([key, value]) => {
      if (key === 'tags') {
        if (Array.isArray(value) && value.length > 0) {
          params.tags = value.join(',')
    }
        return
      }

      if (value !== '' && value !== null && value !== undefined) {
        params[key] = value
      }
    })

    const response = await proposalsApi.getAll(params)
    // Handle new ApiResponse format: { status, message, data: { proposals, pagination } }
    const data = response.data.data || response.data
    proposals.value = data.proposals
    pagination.value = data.pagination
  } catch (error) {} finally {
    loading.value = false
  }
}

const fetchTags = async () => {
  try {
    const response = await tagsApi.getAll()
    // Handle new ApiResponse format: { status, message, data: { tags } }
    const data = response.data.data || response.data
    tags.value = data.tags
  } catch (error) {}
}

const updateFilters = (newFilters) => {
  filters.value = newFilters
  fetchProposals(1)
}

const goToPage = (page) => {
  fetchProposals(page)
}

const handleDelete = async (id) => {
  if (confirm('Are you sure you want to delete this proposal?')) {
    try {
      await proposalsApi.delete(id)
      fetchProposals(pagination.value?.current_page || 1)
    } catch (error) {}
  }
}

onMounted(async () => {
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
  
  // Listen to real-time events
  window.addEventListener('proposal-submitted', handleProposalSubmitted)
  window.addEventListener('proposal-status-changed', handleProposalStatusChanged)
})

onUnmounted(() => {
  // Clean up event listeners
  window.removeEventListener('proposal-submitted', handleProposalSubmitted)
  window.removeEventListener('proposal-status-changed', handleProposalStatusChanged)
})
</script>

