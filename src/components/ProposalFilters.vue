<template>
  <div class="relative z-20 bg-white dark:bg-ocean-800 rounded-xl shadow-lg border border-gray-100 dark:border-ocean-700 mb-4 sm:mb-5 transition-colors" style="overflow: visible;">
    <!-- Header with toggle -->
    <div
        class="flex items-center justify-between p-3 sm:p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-ocean-700 dark:to-ocean-600 cursor-pointer hover:from-blue-100 hover:to-indigo-100 dark:hover:from-ocean-600 dark:hover:to-ocean-500 transition-colors"
        @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center gap-2 sm:gap-2.5">
        <svg
            class="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-600 dark:text-ocean-300"
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
        <h3 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-ocean-100">Filters</h3>
        <span
            v-if="proposalsCount !== null && proposalsCount !== undefined"
            class="px-2 py-0.5 bg-blue-600 dark:bg-ocean-500 text-white text-xs font-medium rounded-full whitespace-nowrap"
        >
          {{ proposalsCount }} {{ proposalsCount === 1 ? 'result' : 'results' }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
            v-if="activeFiltersCount > 0"
            @click.stop="clearFilters"
            class="px-2.5 py-1 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          Clear All
        </button>
        <svg
            :class="[
            'w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-600 dark:text-ocean-300 transition-transform duration-200',
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
      <div v-show="isExpanded" class="p-3 sm:p-4 border-t border-gray-100 dark:border-ocean-700 overflow-visible">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <!-- Search Input -->
          <div class="space-y-1.5">
            <label class="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-ocean-200">
              <svg
                  class="w-3.5 h-3.5 text-gray-500 dark:text-ocean-400"
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
                  class="w-full pl-9 pr-3 py-1.5 sm:py-2 border-2 border-gray-200 dark:border-ocean-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 focus:border-transparent transition-all text-sm bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100 placeholder-gray-400 dark:placeholder-ocean-500"
                  @input="debouncedUpdate"
              />
              <svg
                  class="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-ocean-500"
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

          <!-- Tags Filter - Searchable Dropdown -->
          <div class="space-y-1.5 relative z-10">
            <label class="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-ocean-200">
              <svg
                  class="w-3.5 h-3.5 text-gray-500 dark:text-ocean-400"
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
            <TagMultiSelect v-model="localFilters.tags" :options="tags" @change="updateFilters" />

            <!-- Selected Tags Display -->
            <div v-if="selectedTags.length > 0" class="flex flex-wrap gap-1.5 mt-2">
              <span
                  v-for="tagId in selectedTags"
                  :key="tagId"
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 dark:bg-ocean-700 text-blue-800 dark:text-ocean-200 text-xs font-medium rounded-full border border-blue-200 dark:border-ocean-600"
              >
                {{ getTagName(tagId) }}
                <button
                    @click="removeTag(tagId)"
                    class="hover:text-blue-900 dark:hover:text-ocean-100 transition-colors rounded-full hover:bg-blue-200 dark:hover:bg-ocean-600 p-0.5"
                    aria-label="Remove tag"
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
          <div v-if="showStatusFilter" class="space-y-1.5">
            <label for="filter-status" class="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-ocean-200">
              <svg
                  class="w-3.5 h-3.5 text-gray-500 dark:text-ocean-400"
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
            <AppSelect id="filter-status" v-model="localFilters.status" :options="statusOptions" placeholder="All Statuses" @change="updateFilters" />
            <!-- Status Badge Display -->
            <div v-if="localFilters.status" class="mt-1.5">
              <span
                  :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  getStatusClass(localFilters.status)
                ]"
              >
                <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="getStatusDotClass(localFilters.status)"></span>
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
import { useDebounceFn } from '@vueuse/core'
import AppSelect from './AppSelect.vue'
import TagMultiSelect from './TagMultiSelect.vue'
import { statusOptions } from '../utils/selectOptions'

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
  proposalsCount: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['update:filters'])

const isExpanded = ref(true)
const localFilters = ref({
  search: props.filters.search || '',
  tags: [...(props.filters.tags || [])],
  status: props.filters.status || '',
})

// Debounced update for search input (300ms delay)
const updateFilters = () => {
  emit('update:filters', { ...localFilters.value, tags: [...localFilters.value.tags] })
}

const debouncedUpdate = useDebounceFn(() => {
  updateFilters()
}, 300)

// Track tag identities as well as their count, without mutating parent state.
watch(
    () => [props.filters.search, props.filters.status, props.filters.tags],
    () => {
      localFilters.value = {
        search: props.filters.search || '',
        tags: [...(props.filters.tags || [])],
        status: props.filters.status || '',
      }
    },
    { immediate: true, deep: true }
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
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  }
  return classes[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
}

const getStatusDotClass = (status) => {
  const classes = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
  }
  return classes[status] || 'bg-gray-500'
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
</style>
