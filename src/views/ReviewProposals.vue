<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Proposals for Review</h1>

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
        @click="goToDetail(proposal.id)"
        class="cursor-pointer"
      >
        <ProposalCard
          :proposal="proposal"
      />
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
import { useRouter } from 'vue-router'
import { proposalsApi, tagsApi } from '../api'
import ProposalCard from '../components/ProposalCard.vue'
import ProposalFilters from '../components/ProposalFilters.vue'

const router = useRouter()
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
    const response = await proposalsApi.getForReview(params)
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

const goToDetail = (id) => {
  router.push(`/proposals/${id}`)
}

onMounted(() => {
  fetchProposals()
  fetchTags()
})
</script>

