<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">My Proposals</h1>
      <router-link
        to="/proposals/new"
        class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
        New Proposal
      </router-link>
    </div>

    <ProposalFilters
      :filters="filters"
      :tags="tags"
      @update:filters="updateFilters"
    />

    <div v-if="loading" class="text-center py-8">Loading...</div>
    <div v-else-if="proposals.length === 0" class="text-center py-8 text-gray-500">
      No proposals found.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ProposalCard
        v-for="proposal in proposals"
        :key="proposal.id"
        :proposal="proposal"
        :show-actions="true"
        @delete="handleDelete"
      />
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
import ProposalCard from '../components/ProposalCard.vue'
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

    const response = await proposalsApi.getAll(params)
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

const handleDelete = async (id) => {
  if (confirm('Are you sure you want to delete this proposal?')) {
    try {
      await proposalsApi.delete(id)
      fetchProposals(pagination.value?.current_page || 1)
    } catch (error) {
      console.error('Error deleting proposal:', error)
      alert('Failed to delete proposal')
    }
  }
}

onMounted(() => {
  fetchProposals()
  fetchTags()
})
</script>

