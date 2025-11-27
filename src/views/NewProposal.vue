<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Submit New Proposal</h1>
    <ProposalForm
      :loading="loading"
      :errors="errors"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { proposalsApi } from '../api'
import ProposalForm from '../components/ProposalForm.vue'

const router = useRouter()
const loading = ref(false)
const errors = ref({})

const handleSubmit = async (formData) => {
  loading.value = true
  errors.value = {}
  try {
    await proposalsApi.create(formData)
    router.push('/proposals')
  } catch (error) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    }
    // Toast will be shown automatically by axios interceptor
  } finally {
    loading.value = false
  }
}
</script>

