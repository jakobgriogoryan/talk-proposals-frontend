<template>
  <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div class="flex justify-between items-start mb-4">
      <h3 class="text-xl font-semibold text-gray-800">
        <router-link
          :to="`/proposals/${proposal.id}`"
          class="hover:text-blue-600"
        >
          {{ proposal.title }}
        </router-link>
      </h3>
      <span
        :class="statusClasses"
        class="px-3 py-1 rounded-full text-sm font-medium"
      >
        {{ proposal.status }}
      </span>
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
    <div v-if="showActions" class="mt-4 flex space-x-2">
      <router-link
        :to="`/proposals/${proposal.id}/edit`"
        class="text-blue-600 hover:text-blue-800 text-sm"
      >
        Edit
      </router-link>
      <button
        @click="$emit('delete', proposal.id)"
        class="text-red-600 hover:text-red-800 text-sm"
      >
        Delete
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  proposal: {
    type: Object,
    required: true,
  },
  showActions: {
    type: Boolean,
    default: false,
  },
})

const statusClasses = computed(() => {
  const status = props.proposal.status
  if (status === 'approved') return 'bg-green-100 text-green-800'
  if (status === 'rejected') return 'bg-red-100 text-red-800'
  return 'bg-yellow-100 text-yellow-800'
})
</script>

