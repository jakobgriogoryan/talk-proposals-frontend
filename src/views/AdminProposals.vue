<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Admin Dashboard</h1>

    <ProposalFilters
      :filters="filters"
      :tags="tags"
      :show-status-filter="true"
      @update:filters="updateFilters"
    />

    <div v-if="loading" class="text-center py-8">Loading...</div>
    <div v-else-if="proposals.length === 0" class="text-center py-8 text-gray-500">
      No proposals found.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="proposal in proposals"
        :key="proposal.id"
        class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
      >
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold text-gray-800">
            <router-link
              :to="`/proposals/${proposal.id}`"
              class="hover:text-blue-600"
            >
              {{ proposal.title }}
            </router-link>
          </h3>
          <select
            :value="proposal.status"
            @change="updateStatus(proposal.id, $event.target.value)"
            class="px-3 py-1 rounded-full text-sm font-medium border"
            :class="getStatusClass(proposal.status)"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <p class="text-gray-600 mb-4 line-clamp-3">
          {{ proposal.description }}
        </p>
        <div class="flex items-center justify-between">
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in proposal.tags"
              :key="tag.id"
              class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
            >
              {{ tag.name }}
            </span>
          </div>
          <div class="text-sm text-gray-500">
            By {{ proposal.user?.name }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="pagination && pagination.last_page > 1" class="mt-6 flex justify-center">
      <button
        v-for="page in pagination.last_page"
        :key="page"
        @click="goToPage(page)"
        :class="[
          'px-4 py-2 mx-1 rounded',
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
    const params = {
      page,
      ...filters.value,
    }
    if (params.tags.length > 0) {
      params.tags = params.tags.join(',')
    }
    const response = await proposalsApi.getAllForAdmin(params)
    proposals.value = response.data.proposals
    pagination.value = response.data.pagination
  } catch (error) {
    console.error('Error fetching proposals:', error)
  } finally {
    loading.value = false
  }
}

const fetchTags = async () => {
  try {
    const response = await tagsApi.getAll()
    tags.value = response.data.tags
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
    await proposalsApi.updateStatus(id, status)
    const proposal = proposals.value.find(p => p.id === id)
    if (proposal) {
      proposal.status = status
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to update status')
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

