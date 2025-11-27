<template>
  <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 sm:gap-0 mb-3 sm:mb-4">
      <h3 class="text-lg sm:text-xl font-semibold text-gray-800 flex-1">
        <router-link
          :to="`/proposals/${proposal.id}`"
          class="hover:text-blue-600 transition-colors line-clamp-2"
        >
          {{ proposal.title }}
        </router-link>
      </h3>
      <span
        :class="statusClasses"
        class="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap shrink-0"
      >
        {{ proposal.status }}
      </span>
    </div>
    <p class="text-gray-600 mb-3 sm:mb-4 line-clamp-3 text-sm sm:text-base flex-grow">
      {{ proposal.description }}
    </p>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-0">
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
    <div v-if="showActions" class="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:space-x-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200">
      <router-link
        :to="`/proposals/${proposal.id}/edit`"
        class="text-blue-600 hover:text-blue-800 text-sm text-center sm:text-left"
      >
        Edit
      </router-link>
      <button
        @click="$emit('delete', proposal.id)"
        class="text-red-600 hover:text-red-800 text-sm text-center sm:text-left"
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

