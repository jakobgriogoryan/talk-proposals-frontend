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

    <div v-if="loading" class="text-center py-8 text-gray-500 dark:text-ocean-400">Loading...</div>
    <div v-else-if="proposals.length === 0" class="text-center py-8 sm:py-12 text-gray-500 dark:text-ocean-400">
      <p class="text-base sm:text-lg">No proposals found.</p>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <ProposalCard
        v-for="proposal in proposals"
        :key="proposal.id"
        :proposal="proposal"
        :show-actions="true"
        @delete="handleDelete"
      />
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
import { ref, onMounted } from 'vue'
import { proposalsApi, tagsApi } from '../api'
import ProposalCard from '../components/ProposalCard.vue'
import ProposalFilters from '../components/ProposalFilters.vue'
import TopRatedSlider from '../components/TopRatedSlider.vue'

const proposals = ref([])
const tags = ref([])
const loading = ref(false)
const filters = ref({
  search: '',
  tags: [],
  status: '',
})
const pagination = ref(null)

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
  } catch (error) {
    console.error('Error fetching proposals:', error)
  } finally {
    loading.value = false
  }
}

const fetchTags = async () => {
  try {
    const response = await tagsApi.getAll()
    // Handle new ApiResponse format: { status, message, data: { tags } }
    const data = response.data.data || response.data
    tags.value = data.tags
  } catch (error) {
    console.error('Error fetching tags:', error)
  }
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
    } catch (error) {
      console.error('Error deleting proposal:', error)
      // Toast will be shown automatically by axios interceptor
    }
  }
}

onMounted(() => {
  fetchProposals()
  fetchTags()
})
</script>

