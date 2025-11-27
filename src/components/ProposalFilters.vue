<template>
  <div class="bg-white p-4 rounded-lg shadow-md mb-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Search
        </label>
        <input
          v-model="localFilters.search"
          type="text"
          placeholder="Search by title..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="updateFilters"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <select
          v-model="localFilters.tags"
          multiple
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="updateFilters"
        >
          <option v-for="tag in tags" :key="tag.id" :value="tag.id">
            {{ tag.name }}
          </option>
        </select>
      </div>
      <div v-if="showStatusFilter">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          v-model="localFilters.status"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="updateFilters"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>
    <div class="mt-4">
      <button
        @click="clearFilters"
        class="text-sm text-gray-600 hover:text-gray-800"
      >
        Clear filters
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({}),
  },
  tags: {
    type: Array,
    default: () => [],
  },
  showStatusFilter: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:filters'])

const localFilters = ref({
  search: props.filters.search || '',
  tags: props.filters.tags || [],
  status: props.filters.status || '',
})

watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = {
      search: newFilters.search || '',
      tags: newFilters.tags || [],
      status: newFilters.status || '',
    }
  },
  { deep: true }
)

const updateFilters = () => {
  emit('update:filters', { ...localFilters.value })
}

const clearFilters = () => {
  localFilters.value = {
    search: '',
    tags: [],
    status: '',
  }
  updateFilters()
}
</script>

