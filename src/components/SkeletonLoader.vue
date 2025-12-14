<template>
  <div class="animate-pulse">
    <!-- Proposal Card Skeleton -->
    <div v-if="type === 'proposal-card'" class="bg-white dark:bg-ocean-800 rounded-xl shadow-md p-3 sm:p-4 border border-gray-100 dark:border-ocean-700 h-full flex flex-col">
      <div class="flex justify-between items-start mb-2 sm:mb-3">
        <div class="flex-1">
          <div class="h-5 sm:h-6 bg-gray-200 dark:bg-ocean-700 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-1/2"></div>
        </div>
        <div class="h-6 w-16 bg-gray-200 dark:bg-ocean-700 rounded-full"></div>
      </div>
      <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-full mb-2"></div>
      <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-5/6 mb-3"></div>
      <div class="flex justify-between items-center mt-auto">
        <div class="flex gap-2">
          <div class="h-5 w-12 bg-gray-200 dark:bg-ocean-700 rounded-full"></div>
          <div class="h-5 w-16 bg-gray-200 dark:bg-ocean-700 rounded-full"></div>
        </div>
        <div class="h-4 w-20 bg-gray-200 dark:bg-ocean-700 rounded"></div>
      </div>
    </div>

    <!-- Proposal Detail Skeleton -->
    <div v-else-if="type === 'proposal-detail'" class="bg-white/95 dark:bg-ocean-800/95 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-ocean-700">
      <div class="flex justify-between items-start mb-4">
        <div class="flex-1">
          <div class="h-8 sm:h-10 bg-gray-200 dark:bg-ocean-700 rounded w-3/4 mb-3"></div>
          <div class="h-5 bg-gray-200 dark:bg-ocean-700 rounded w-1/3"></div>
        </div>
        <div class="h-8 w-24 bg-gray-200 dark:bg-ocean-700 rounded-full"></div>
      </div>
      <div class="flex gap-2 mb-4">
        <div class="h-6 w-16 bg-gray-200 dark:bg-ocean-700 rounded-full"></div>
        <div class="h-6 w-20 bg-gray-200 dark:bg-ocean-700 rounded-full"></div>
      </div>
      <div class="space-y-3">
        <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-full"></div>
        <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-full"></div>
        <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-5/6"></div>
      </div>
    </div>

    <!-- Review Skeleton -->
    <div v-else-if="type === 'review'" class="bg-white/95 dark:bg-ocean-800/95 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-md border-l-4 border-gray-300 dark:border-ocean-600 mb-3 sm:mb-4">
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1">
          <div class="h-5 bg-gray-200 dark:bg-ocean-700 rounded w-32 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-24"></div>
        </div>
        <div class="h-6 w-12 bg-gray-200 dark:bg-ocean-700 rounded"></div>
      </div>
      <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-full mt-2"></div>
      <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-4/5 mt-2"></div>
    </div>

    <!-- List Skeleton -->
    <div v-else-if="type === 'list'" class="space-y-3">
      <div
        v-for="i in count"
        :key="i"
        class="bg-white dark:bg-ocean-800 rounded-xl shadow-md p-3 sm:p-4 border border-gray-100 dark:border-ocean-700"
      >
        <div class="h-5 bg-gray-200 dark:bg-ocean-700 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-full mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-5/6"></div>
      </div>
    </div>

    <!-- Generic Skeleton -->
    <div v-else class="bg-white dark:bg-ocean-800 rounded-xl shadow-md p-3 sm:p-4 border border-gray-100 dark:border-ocean-700">
      <div class="h-5 bg-gray-200 dark:bg-ocean-700 rounded w-3/4 mb-2"></div>
      <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-full mb-2"></div>
      <div class="h-4 bg-gray-200 dark:bg-ocean-700 rounded w-5/6"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'generic',
    validator: (value) => ['proposal-card', 'proposal-detail', 'review', 'list', 'generic'].includes(value),
  },
  count: {
    type: Number,
    default: 1,
  },
})
</script>

