<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-0">
    <h1 class="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-ocean-400 dark:to-ocean-300 bg-clip-text text-transparent">Edit Proposal</h1>
    <div v-if="loading" class="text-center py-8 text-gray-500 dark:text-ocean-400">Loading...</div>
    <ProposalForm
      v-else-if="proposal"
      :proposal="proposal"
      :loading="saving"
      :errors="errors"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { proposalsApi } from '../api'
import ProposalForm from '../components/ProposalForm.vue'

const router = useRouter()
const route = useRoute()
const proposal = ref(null)
const loading = ref(true)
const saving = ref(false)
const errors = ref({})
let requestVersion = 0

const fetchProposal = async (id) => {
  const version = ++requestVersion
  loading.value = true
  saving.value = false
  proposal.value = null
  errors.value = {}
  try {
    const response = await proposalsApi.getOne(id)
    if (version !== requestVersion) return
    // Handle new ApiResponse format: { status, message, data: { proposal } }
    const data = response.data.data || response.data
    proposal.value = data.proposal
  } catch (error) {
    if (version === requestVersion) router.push('/proposals')
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

const handleSubmit = async (formData) => {
  if (saving.value || loading.value || !proposal.value) return
  const version = requestVersion
  const id = route.params.id
  saving.value = true
  errors.value = {}
  try {
    await proposalsApi.update(id, formData)
    if (version === requestVersion) router.push(`/proposals/${id}`)
  } catch (error) {
    if (version === requestVersion && error.response?.data?.errors) {
      errors.value = error.response.data.errors
    }
    // Toast will be shown automatically by axios interceptor
  } finally {
    if (version === requestVersion) saving.value = false
  }
}

watch(() => route.params.id, fetchProposal, { immediate: true })
onUnmounted(() => { requestVersion++ })
</script>
