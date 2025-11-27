<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-0">
    <h1 class="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-ocean-400 dark:to-ocean-300 bg-clip-text text-transparent">Edit Proposal</h1>
    <div v-if="loading" class="text-center py-8 text-gray-500 dark:text-ocean-400">Loading...</div>
    <ProposalForm
      v-else
      :proposal="proposal"
      :loading="saving"
      :errors="errors"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { proposalsApi } from '../api'
import ProposalForm from '../components/ProposalForm.vue'

const router = useRouter()
const route = useRoute()
const proposal = ref(null)
const loading = ref(true)
const saving = ref(false)
const errors = ref({})

const fetchProposal = async () => {
  try {
    const response = await proposalsApi.getOne(route.params.id)
    // Handle new ApiResponse format: { status, message, data: { proposal } }
    const data = response.data.data || response.data
    proposal.value = data.proposal
  } catch (error) {
    console.error('Error fetching proposal:', error)
    router.push('/proposals')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (formData) => {
  saving.value = true
  errors.value = {}
  try {
    await proposalsApi.update(route.params.id, formData)
    router.push(`/proposals/${route.params.id}`)
  } catch (error) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    }
    // Toast will be shown automatically by axios interceptor
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchProposal()
})
</script>

