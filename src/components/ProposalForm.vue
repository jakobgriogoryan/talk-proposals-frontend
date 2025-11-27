<template>
  <form @submit.prevent="handleSubmit" class="space-y-4 sm:space-y-6">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
        Title *
      </label>
      <input
        v-model="form.title"
        type="text"
        required
        maxlength="255"
        class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        :class="{ 'border-red-300 focus:ring-red-500': errors.title }"
      />
      <div v-if="errors.title" class="text-red-500 text-sm mt-1">
        {{ errors.title }}
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
        Description *
      </label>
      <textarea
        v-model="form.description"
        rows="6"
        required
        class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base resize-y"
        :class="{ 'border-red-300 focus:ring-red-500': errors.description }"
      ></textarea>
      <div v-if="errors.description" class="text-red-500 text-sm mt-1">
        {{ errors.description }}
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
        PDF File <span class="text-gray-500 text-xs">(optional, max 4MB)</span>
      </label>
      <input
        type="file"
        accept=".pdf"
        @change="handleFileChange"
        class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        :class="{ 'border-red-300 focus:ring-red-500': errors.file || fileError }"
      />
      <p class="text-xs text-gray-500 mt-1">Maximum file size: 4MB. Only PDF files are allowed.</p>
      <div v-if="errors.file" class="text-red-500 text-sm mt-1">
        {{ errors.file }}
      </div>
      <div v-if="fileError" class="text-red-500 text-sm mt-1">
        {{ fileError }}
      </div>
      <div v-if="existingFile" class="text-sm text-gray-600 mt-1">
        Current file: <a :href="existingFile" target="_blank" class="text-blue-600 hover:underline">{{ existingFile.split('/').pop() }}</a>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
        Tags <span class="text-gray-500 text-xs">(optional)</span>
      </label>
      
      <!-- Selected Tags Display -->
      <div v-if="form.tags.length > 0" class="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
        <span
          v-for="(tag, index) in form.tags"
          :key="index"
          class="bg-blue-100 text-blue-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm flex items-center"
        >
          {{ tag }}
          <button
            type="button"
            @click="removeTag(index)"
            class="ml-1.5 sm:ml-2 text-blue-600 hover:text-blue-800 text-base sm:text-lg leading-none"
            aria-label="Remove tag"
          >
            ×
          </button>
        </span>
      </div>

      <!-- Tag Input with Existing Tags Suggestions -->
      <div class="space-y-2">
        <div class="relative">
          <input
            v-model="tagInput"
            type="text"
            @keydown.enter.prevent="addTag"
            @input="filterExistingTags"
            placeholder="Type tag name and press Enter, or select from existing tags below"
            class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            :class="{ 'border-red-300 focus:ring-red-500': errors.tags }"
          />
        </div>

        <!-- Existing Tags to Select From -->
        <div v-if="availableTags.length > 0" class="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-32 overflow-y-auto">
          <p class="text-xs text-gray-600 mb-2">Select from existing tags:</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in availableTags"
              :key="tag.id"
              type="button"
              @click="selectExistingTag(tag.name)"
              :disabled="form.tags.includes(tag.name)"
              class="px-2 py-1 rounded-full text-xs font-medium transition-all"
              :class="form.tags.includes(tag.name)
                ? 'bg-blue-200 text-blue-700 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300'"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="errors.tags" class="text-red-500 text-sm mt-1">
        {{ errors.tags }}
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:space-x-4">
      <button
        type="submit"
        :disabled="loading"
        class="w-full sm:w-auto bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm sm:text-base"
      >
        {{ loading ? 'Saving...' : (isEdit ? 'Update' : 'Submit') }}
      </button>
      <router-link
        to="/proposals"
        class="w-full sm:w-auto bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors text-center text-sm sm:text-base"
      >
        Cancel
      </router-link>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { tagsApi } from '../api'

const props = defineProps({
  proposal: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['submit'])

const isEdit = !!props.proposal
const tagInput = ref('')
const existingFile = ref(props.proposal?.file_path || null)
const fileError = ref('')
const allTags = ref([])
const tagSearchQuery = ref('')

const form = ref({
  title: props.proposal?.title || '',
  description: props.proposal?.description || '',
  file: null,
  tags: props.proposal?.tags?.map(t => t.name) || [],
})

watch(
  () => props.proposal,
  (newProposal) => {
    if (newProposal) {
      form.value = {
        title: newProposal.title || '',
        description: newProposal.description || '',
        file: null,
        tags: newProposal.tags?.map(t => t.name) || [],
      }
      existingFile.value = newProposal.file_path || null
    }
  },
  { deep: true }
)

const availableTags = computed(() => {
  if (!tagSearchQuery.value.trim()) {
    return allTags.value.filter(tag => !form.value.tags.includes(tag.name))
  }
  const query = tagSearchQuery.value.toLowerCase().trim()
  return allTags.value.filter(tag => 
    !form.value.tags.includes(tag.name) && 
    tag.name.toLowerCase().includes(query)
  )
})

const fetchTags = async () => {
  try {
    const response = await tagsApi.getAll()
    const data = response.data.data || response.data
    allTags.value = data.tags || []
  } catch (error) {
    console.error('Error fetching tags:', error)
  }
}

const filterExistingTags = () => {
  tagSearchQuery.value = tagInput.value
}

const selectExistingTag = (tagName) => {
  if (!form.value.tags.includes(tagName)) {
    form.value.tags.push(tagName)
    tagInput.value = ''
    tagSearchQuery.value = ''
  }
}

const handleFileChange = (event) => {
  fileError.value = ''
  const file = event.target.files[0]
  
  if (!file) {
    form.value.file = null
    return
  }

  // Validate file type
  if (file.type !== 'application/pdf') {
    fileError.value = 'Only PDF files are allowed'
    form.value.file = null
    event.target.value = ''
    return
  }

  // Validate file size (4MB = 4 * 1024 * 1024 bytes)
  const maxSize = 4 * 1024 * 1024
  if (file.size > maxSize) {
    fileError.value = 'File size must be less than 4MB'
    form.value.file = null
    event.target.value = ''
    return
  }

  form.value.file = file
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    tagInput.value = ''
    tagSearchQuery.value = ''
  }
}

const removeTag = (index) => {
  form.value.tags.splice(index, 1)
}

const handleSubmit = () => {
  // Clear file error before submit
  fileError.value = ''
  emit('submit', form.value)
}

onMounted(() => {
  fetchTags()
})
</script>

<style scoped>
/* Custom scrollbar for tags container */
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
</style>
