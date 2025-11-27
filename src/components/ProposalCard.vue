<template>
  <div class="bg-white dark:bg-ocean-800 rounded-xl shadow-md p-3 sm:p-4 hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-gray-100 dark:border-ocean-700 hover:border-blue-200 dark:hover:border-ocean-500 hover:-translate-y-1">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 sm:gap-0 mb-2 sm:mb-3">
      <h3 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-ocean-100 flex-1">
        <router-link
          :to="`/proposals/${proposal.id}`"
          class="hover:text-blue-600 dark:hover:text-ocean-300 transition-all line-clamp-2 hover:underline decoration-2 underline-offset-2"
        >
          {{ proposal.title }}
        </router-link>
      </h3>
      <span
        :class="statusClasses"
        class="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 shadow-sm"
      >
        {{ proposal.status }}
      </span>
    </div>
    <p class="text-gray-600 dark:text-ocean-300 mb-2 sm:mb-3 line-clamp-2 text-xs sm:text-sm flex-grow">
      {{ proposal.description }}
    </p>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-0">
      <div class="flex flex-wrap gap-1.5 sm:gap-2">
        <span
          v-for="tag in proposal.tags"
          :key="tag.id"
          class="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-ocean-700 dark:to-ocean-600 text-blue-800 dark:text-ocean-200 px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-shadow"
        >
          {{ tag.name }}
        </span>
      </div>
      <div class="text-xs sm:text-sm text-gray-500 dark:text-ocean-400">
        By {{ proposal.user?.name }}
      </div>
    </div>
    <div v-if="showActions" class="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:space-x-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200 dark:border-ocean-700">
      <router-link
        :to="`/proposals/${proposal.id}/edit`"
        class="text-blue-600 dark:text-ocean-400 hover:text-blue-800 dark:hover:text-ocean-300 text-sm text-center sm:text-left"
      >
        Edit
      </router-link>
      <button
        @click="$emit('delete', proposal.id)"
        class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm text-center sm:text-left"
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
  if (status === 'approved') return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
  if (status === 'rejected') return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
})
</script>

