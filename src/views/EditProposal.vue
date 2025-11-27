<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Edit Proposal</h1>
    <div v-if="loading" class="text-center py-8">Loading...</div>
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
    proposal.value = response.data.proposal
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
    } else {
      alert(error.response?.data?.message || 'Failed to update proposal')
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchProposal()
})
</script>

