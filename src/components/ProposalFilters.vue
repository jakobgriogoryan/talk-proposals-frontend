<template>
  <div class="bg-white rounded-xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
    <!-- Header with toggle -->
    <div
      class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center gap-3">
        <svg
          class="w-5 h-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <h3 class="text-lg font-semibold text-gray-800">Filters</h3>
        <span
          v-if="activeFiltersCount > 0"
          class="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full"
        >
          {{ activeFiltersCount }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="activeFiltersCount > 0"
          @click.stop="clearFilters"
          class="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          Clear All
        </button>
        <svg
          :class="[
            'w-5 h-5 text-gray-600 transition-transform duration-200',
            isExpanded ? 'rotate-180' : ''
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>

    <!-- Filters Content -->
    <Transition name="slide">
      <div v-show="isExpanded" class="p-4 sm:p-6 border-t border-gray-100">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <!-- Search Input -->
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <svg
                class="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span class="hidden sm:inline">Search by Title</span>
              <span class="sm:hidden">Search</span>
            </label>
            <div class="relative">
              <input
                v-model="localFilters.search"
                type="text"
                placeholder="Enter proposal title..."
                class="w-full pl-10 pr-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                @input="debouncedUpdate"
              />
              <svg
                class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <!-- Tags Filter -->
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <svg
                class="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Tags
            </label>
            <div class="relative">
              <select
                v-model="localFilters.tags"
                multiple
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                @change="updateFilters"
              >
                <option v-for="tag in tags" :key="tag.id" :value="tag.id">
                  {{ tag.name }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  class="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <!-- Selected Tags Display -->
            <div v-if="selectedTags.length > 0" class="flex flex-wrap gap-2 mt-2">
              <span
                v-for="tagId in selectedTags"
                :key="tagId"
                class="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
              >
                {{ getTagName(tagId) }}
                <button
                  @click="removeTag(tagId)"
                  class="hover:text-blue-900 transition-colors"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            </div>
          </div>

          <!-- Status Filter -->
          <div v-if="showStatusFilter" class="space-y-2">
            <label class="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <svg
                class="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Status
            </label>
            <div class="relative">
              <select
                v-model="localFilters.status"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                @change="updateFilters"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  class="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <!-- Status Badge Display -->
            <div v-if="localFilters.status" class="mt-2">
              <span
                :class="[
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                  getStatusClass(localFilters.status)
                ]"
              >
                <span class="w-2 h-2 rounded-full mr-2" :class="getStatusDotClass(localFilters.status)"></span>
                {{ localFilters.status.charAt(0).toUpperCase() + localFilters.status.slice(1) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

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

const isExpanded = ref(true)
const localFilters = ref({
  search: props.filters.search || '',
  tags: props.filters.tags || [],
  status: props.filters.status || '',
})

let debounceTimer = null

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

const activeFiltersCount = computed(() => {
  let count = 0
  if (localFilters.value.search) count++
  if (localFilters.value.tags?.length > 0) count++
  if (localFilters.value.status) count++
  return count
})

const selectedTags = computed(() => {
  return Array.isArray(localFilters.value.tags) ? localFilters.value.tags : []
})

const getTagName = (tagId) => {
  const tag = props.tags.find(t => t.id === tagId)
  return tag ? tag.name : ''
}

const removeTag = (tagId) => {
  localFilters.value.tags = localFilters.value.tags.filter(id => id !== tagId)
  updateFilters()
}

const getStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusDotClass = (status) => {
  const classes = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
  }
  return classes[status] || 'bg-gray-500'
}

const debouncedUpdate = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    updateFilters()
  }, 500)
}

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

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* Custom scrollbar for select */
select::-webkit-scrollbar {
  width: 8px;
}

select::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

select::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

select::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
