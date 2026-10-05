<template>
  <div>
    <h1 class="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-ocean-400 dark:to-ocean-300 bg-clip-text text-transparent">Admin Dashboard</h1>

    <TopRatedSlider />

    <ProposalFilters
      :filters="filters"
      :tags="tags"
      :show-status-filter="true"
      :proposals-count="pagination?.total || proposals.length"
      @update:filters="updateFilters"
    />

    <div v-if="loading" class="text-center py-8 text-gray-500 dark:text-ocean-400">Loading...</div>
    <div v-else-if="proposals.length === 0" class="text-center py-8 sm:py-12 text-gray-500 dark:text-ocean-400">
      <p class="text-base sm:text-lg">No proposals found.</p>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div
        v-for="proposal in proposals"
        :key="proposal.id"
        class="bg-white/95 dark:bg-ocean-800/95 backdrop-blur-sm rounded-xl shadow-md p-3 sm:p-4 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-ocean-700 hover:border-blue-200 dark:hover:border-ocean-500 hover:-translate-y-1"
      >
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 sm:gap-0 mb-2 sm:mb-3">
          <h3 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-ocean-100 flex-1">
            <router-link
              :to="`/proposals/${proposal.id}`"
              class="hover:text-blue-600 dark:hover:text-ocean-300 transition-colors line-clamp-2"
            >
              {{ proposal.title }}
            </router-link>
          </h3>
          <AppSelect :model-value="proposal.status" :options="statusOptions" compact :aria-label="`Status for ${proposal.title}`" @change="updateStatus(proposal.id, $event)" />
        </div>
        <p class="text-gray-600 dark:text-ocean-300 mb-2 sm:mb-3 line-clamp-2 text-xs sm:text-sm">
          {{ proposal.description }}
        </p>
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div class="flex flex-wrap gap-1.5 sm:gap-2">
            <span
              v-for="tag in proposal.tags"
              :key="tag.id"
              class="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-ocean-700 dark:to-ocean-600 text-blue-800 dark:text-ocean-200 px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium shadow-sm"
            >
              {{ tag.name }}
            </span>
          </div>
          <div class="text-xs sm:text-sm text-gray-500 dark:text-ocean-400">
            By {{ proposal.user?.name }}
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
import { ref, onMounted, onUnmounted } from 'vue'
import { proposalsApi, tagsApi } from '../api'
import { useProposalList } from '../composables/useProposalList'
import ProposalFilters from '../components/ProposalFilters.vue'
import TopRatedSlider from '../components/TopRatedSlider.vue'
import AppSelect from '../components/AppSelect.vue'
import { statusOptions } from '../utils/selectOptions'

const tags = ref([])
const { proposals, loading, filters, pagination, fetchProposals, updateFilters,
  goToPage, paginationPages, paginationInfo } = useProposalList(proposalsApi.getAllForAdmin)

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

const updateStatus = async (id, status) => {
  try {
    await proposalsApi.updateStatus(id, status)
    // A changed status can exclude this row from the active filter, even without realtime.
    await fetchProposals(pagination.value?.current_page || 1)
  } catch (error) {
    // Toast will be shown automatically by axios interceptor
  }
}

onMounted(() => {
  fetchProposals()
  fetchTags()
  
  // Listen to real-time events
  window.addEventListener('proposal-submitted', handleProposalSubmitted)
  window.addEventListener('proposal-reviewed', handleProposalReviewed)
  window.addEventListener('proposal-status-changed', handleProposalStatusChanged)
  window.addEventListener('realtime-resynced', handleProposalStatusChanged)
})

onUnmounted(() => {
  window.removeEventListener('proposal-submitted', handleProposalSubmitted)
  window.removeEventListener('proposal-reviewed', handleProposalReviewed)
  window.removeEventListener('proposal-status-changed', handleProposalStatusChanged)
  window.removeEventListener('realtime-resynced', handleProposalStatusChanged)
})
</script>
