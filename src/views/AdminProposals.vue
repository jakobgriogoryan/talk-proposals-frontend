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
          <div class="relative shrink-0">
          <select
            :value="proposal.status"
            @change="updateStatus(proposal.id, $event.target.value)"
              class="appearance-none px-3 sm:px-4 py-1.5 sm:py-2 pr-8 sm:pr-10 rounded-lg text-xs sm:text-sm font-medium border-2 shrink-0 shadow-sm hover:shadow-md transition-all bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100 border-gray-300 dark:border-ocean-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 focus:border-blue-500 dark:focus:border-ocean-400 cursor-pointer"
              :class="getStatusSelectClass(proposal.status)"
          >
              <option value="pending" class="bg-white dark:bg-ocean-900">Pending</option>
              <option value="approved" class="bg-white dark:bg-ocean-900">Approved</option>
              <option value="rejected" class="bg-white dark:bg-ocean-900">Rejected</option>
          </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
              <svg
                class="w-4 h-4 text-gray-400 dark:text-ocean-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
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

    const response = await proposalsApi.getAllForAdmin(params)
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

const updateStatus = async (id, status) => {
  try {
    const response = await proposalsApi.updateStatus(id, status)
    // Handle new ApiResponse format: { status, message, data: { proposal } }
    const data = response.data.data || response.data
    const proposal = proposals.value.find(p => p.id === id)
    if (proposal && data.proposal) {
      Object.assign(proposal, data.proposal)
    } else if (proposal) {
      proposal.status = status
    }
  } catch (error) {
    // Toast will be shown automatically by axios interceptor
  }
}

const getStatusClass = (status) => {
  if (status === 'approved') return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
  if (status === 'rejected') return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
}

const getStatusSelectClass = (status) => {
  if (status === 'approved') return 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
  if (status === 'rejected') return 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
  return 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
}

onMounted(() => {
  fetchProposals()
  fetchTags()
})
</script>

