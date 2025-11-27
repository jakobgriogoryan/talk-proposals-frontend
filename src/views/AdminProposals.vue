<template>
  <div>
    <h1 class="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Admin Dashboard</h1>

    <ProposalFilters
      :filters="filters"
      :tags="tags"
      :show-status-filter="true"
      @update:filters="updateFilters"
    />

    <div v-if="loading" class="text-center py-8 text-gray-500">Loading...</div>
    <div v-else-if="proposals.length === 0" class="text-center py-8 sm:py-12 text-gray-500">
      <p class="text-base sm:text-lg">No proposals found.</p>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div
        v-for="proposal in proposals"
        :key="proposal.id"
        class="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
      >
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 sm:gap-0 mb-3 sm:mb-4">
          <h3 class="text-lg sm:text-xl font-semibold text-gray-800 flex-1">
            <router-link
              :to="`/proposals/${proposal.id}`"
              class="hover:text-blue-600 transition-colors line-clamp-2"
            >
              {{ proposal.title }}
            </router-link>
          </h3>
          <select
            :value="proposal.status"
            @change="updateStatus(proposal.id, $event.target.value)"
            class="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border shrink-0"
            :class="getStatusClass(proposal.status)"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <p class="text-gray-600 mb-3 sm:mb-4 line-clamp-3 text-sm sm:text-base">
          {{ proposal.description }}
        </p>
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div class="flex flex-wrap gap-1.5 sm:gap-2">
            <span
              v-for="tag in proposal.tags"
              :key="tag.id"
              class="bg-blue-100 text-blue-800 px-2 py-0.5 sm:py-1 rounded text-xs"
            >
              {{ tag.name }}
            </span>
          </div>
          <div class="text-xs sm:text-sm text-gray-500">
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
          'px-3 sm:px-4 py-2 rounded text-sm sm:text-base transition-colors',
          page === pagination.current_page
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
  if (status === 'approved') return 'bg-green-100 text-green-800'
  if (status === 'rejected') return 'bg-red-100 text-red-800'
  return 'bg-yellow-100 text-yellow-800'
}

onMounted(() => {
  fetchProposals()
  fetchTags()
})
</script>

