<template>
  <div class="bg-white dark:bg-ocean-800 rounded-xl shadow-lg border border-gray-100 dark:border-ocean-700 mb-4 sm:mb-5 transition-colors" style="overflow: visible;">
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
            <div class="relative z-[9999]" ref="dropdownRef">
              <!-- Dropdown Trigger Button -->
              <button
                  @click="toggleDropdown"
                  type="button"
                  class="w-full px-3 py-1.5 sm:py-2 border-2 border-gray-200 dark:border-ocean-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 focus:border-transparent transition-all text-sm bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100 flex items-center justify-between"
              >
                <span class="text-left flex-1">
                  {{ selectedTags.length > 0 ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected` : 'Select tags...' }}
                </span>
                <svg
                    :class="[
                    'w-5 h-5 text-gray-400 dark:text-ocean-500 transition-transform',
                    isDropdownOpen ? 'rotate-180' : ''
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
              </button>

              <!-- Dropdown Menu -->
              <Transition name="dropdown">
                <div
                    v-if="isDropdownOpen"
                    class="absolute z-[9999] w-full mt-1 bg-white dark:bg-ocean-800 border-2 border-gray-200 dark:border-ocean-600 rounded-lg shadow-xl max-h-64 overflow-hidden"
                >
                  <!-- Search Input -->
                  <div class="p-2 border-b border-gray-200 dark:border-ocean-700">
                    <div class="relative">
                      <input
                          v-model="tagSearchQuery"
                          type="text"
                          placeholder="Search tags..."
                          class="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-ocean-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100 placeholder-gray-400 dark:placeholder-ocean-500"
                          @click.stop
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

                  <!-- Tag Options List -->
                  <div class="max-h-48 overflow-y-auto">
                    <div v-if="filteredTags.length === 0" class="px-4 py-3 text-sm text-gray-500 dark:text-ocean-400 text-center">
                      No tags found
                    </div>
                    <label
                        v-for="tag in filteredTags"
                        :key="tag.id"
                        :class="[
                        'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors',
                        localFilters.tags.includes(tag.id)
                          ? 'bg-blue-50 dark:bg-ocean-700/50 hover:bg-blue-100 dark:hover:bg-ocean-700'
                          : 'hover:bg-gray-50 dark:hover:bg-ocean-700/30'
                      ]"
                    >
                      <div class="relative flex items-center">
                        <input
                            type="checkbox"
                            :value="tag.id"
                            :checked="localFilters.tags.includes(tag.id)"
                            @change="toggleTag(tag.id)"
                            class="w-4 h-4 rounded border-2 transition-all cursor-pointer"
                            :class="localFilters.tags.includes(tag.id)
                            ? 'bg-blue-600 dark:bg-ocean-400 border-blue-600 dark:border-ocean-400 text-white'
                            : 'border-gray-300 dark:border-ocean-600 bg-white dark:bg-ocean-900'"
                        />
                        <svg
                            v-if="localFilters.tags.includes(tag.id)"
                            class="absolute left-0.5 top-0.5 w-3 h-3 text-white pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                          <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="3"
                              d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span
                          :class="[
                          'text-sm flex-1',
                          localFilters.tags.includes(tag.id)
                            ? 'text-blue-700 dark:text-ocean-200 font-medium'
                            : 'text-gray-700 dark:text-ocean-300'
                        ]"
                      >
            {{ tag.name }}
                      </span>
                    </label>
                  </div>
                </div>
              </Transition>
            </div>

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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Status
            </label>
            <div class="relative">
              <select
                  v-model="localFilters.status"
                  class="w-full px-3 py-1.5 sm:py-2 border-2 border-gray-200 dark:border-ocean-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 focus:border-transparent transition-all appearance-none text-sm bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100"
                  @change="updateFilters"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                <svg
                    class="w-4 h-4 text-gray-400 dark:text-ocean-500"
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
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

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
const tagSearchQuery = ref('')
const isDropdownOpen = ref(false)
const dropdownRef = ref(null)
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

const filteredTags = computed(() => {
  if (!tagSearchQuery.value.trim()) {
    return props.tags
  }
  const query = tagSearchQuery.value.toLowerCase()
  return props.tags.filter(tag => tag.name.toLowerCase().includes(query))
})

const getTagName = (tagId) => {
  const tag = props.tags.find(t => t.id === tagId)
  return tag ? tag.name : ''
}

const toggleTag = (tagId) => {
  const index = localFilters.value.tags.indexOf(tagId)
  if (index > -1) {
    localFilters.value.tags.splice(index, 1)
  } else {
    localFilters.value.tags.push(tagId)
  }
  updateFilters()
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

// Handle click outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

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
  tagSearchQuery.value = ''
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

/* Dropdown animations */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Custom scrollbar for tag container */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #1a2a3a;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #2d4a5f;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #3d5a6f;
}
</style>
