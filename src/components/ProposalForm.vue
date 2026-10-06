<template>
  <form @submit.prevent="handleSubmit" class="space-y-4 sm:space-y-6 bg-white dark:bg-ocean-800 rounded-xl shadow-xl p-6 sm:p-8 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80 border border-gray-100 dark:border-ocean-700">
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-ocean-200 mb-1.5 sm:mb-2">
        Title *
      </label>
      <input
          v-model="form.title"
          type="text"
          required
          maxlength="255"
          class="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-ocean-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 focus:border-blue-500 dark:focus:border-ocean-500 transition-all shadow-sm hover:shadow-md text-sm sm:text-base bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100"
          :class="{ 'border-red-300 dark:border-red-600 focus:ring-red-500': errors.title }"
      />
      <div v-if="errors.title" class="text-red-500 dark:text-red-400 text-sm mt-1">
        {{ errors.title }}
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-ocean-200 mb-1.5 sm:mb-2">
        Description *
      </label>
      <textarea
          v-model="form.description"
          rows="6"
          required
          class="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-ocean-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 text-sm sm:text-base resize-y bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100"
          :class="{ 'border-red-300 dark:border-red-600 focus:ring-red-500': errors.description }"
      ></textarea>
      <div v-if="errors.description" class="text-red-500 dark:text-red-400 text-sm mt-1">
        {{ errors.description }}
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-ocean-200 mb-1.5 sm:mb-2">
        PDF File <span class="text-gray-500 dark:text-ocean-400 text-xs">(optional, max {{ MAX_PROPOSAL_FILE_MB }}MB)</span>
      </label>
      <input
          ref="fileInput"
          type="file"
          accept=".pdf"
          @change="handleFileChange"
          class="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-ocean-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 text-sm sm:text-base file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-ocean-700 file:text-blue-700 dark:file:text-ocean-200 hover:file:bg-blue-100 dark:hover:file:bg-ocean-600 bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100"
          :class="{ 'border-red-300 dark:border-red-600 focus:ring-red-500': errors.file || fileError }"
      />
      <p class="text-xs text-gray-500 dark:text-ocean-400 mt-1">Maximum file size: {{ MAX_PROPOSAL_FILE_MB }}MB. Only PDF files are allowed.</p>
      <button v-if="form.file || fileError" type="button" @click="clearSelectedFile" class="text-sm text-blue-600 dark:text-ocean-400 underline mt-1">Clear selected file</button>
      <div v-if="errors.file" class="text-red-500 dark:text-red-400 text-sm mt-1">
        {{ errors.file }}
      </div>
      <div v-if="fileError" class="text-red-500 dark:text-red-400 text-sm mt-1">
        {{ fileError }}
      </div>
      <div v-if="existingFile" class="text-sm text-gray-600 dark:text-ocean-300 mt-1">
        Current file: <button type="button" :disabled="downloadingFile" @click="downloadExistingFile" class="text-blue-600 dark:text-ocean-400 hover:underline disabled:opacity-50">{{ downloadingFile ? 'Downloading...' : 'Download PDF' }}</button>
        <p v-if="downloadError" role="alert" class="mt-1 text-red-500 dark:text-red-400">{{ downloadError }}</p>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-ocean-200 mb-1.5 sm:mb-2">
        Tags <span class="text-gray-500 dark:text-ocean-400 text-xs">(optional)</span>
      </label>

      <!-- Selected Tags Display -->
      <div v-if="form.tags.length > 0" class="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
        <span
            v-for="(tag, index) in form.tags"
            :key="index"
            class="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-ocean-700 dark:to-ocean-600 text-blue-800 dark:text-ocean-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm flex items-center shadow-sm hover:shadow-md transition-shadow"
        >
          {{ tag }}
          <button
              type="button"
              @click="removeTag(index)"
              class="ml-1.5 sm:ml-2 text-blue-600 dark:text-ocean-300 hover:text-blue-800 dark:hover:text-ocean-100 text-base sm:text-lg leading-none transition-colors"
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
              class="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-ocean-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ocean-400 focus:border-blue-500 dark:focus:border-ocean-500 transition-all shadow-sm hover:shadow-md text-sm sm:text-base bg-white dark:bg-ocean-900 text-gray-900 dark:text-ocean-100 placeholder-gray-400 dark:placeholder-ocean-500"
              :class="{ 'border-red-300 dark:border-red-600 focus:ring-red-500': errors.tags }"
          />
        </div>

        <!-- Existing Tags to Select From -->
        <div v-if="availableTags.length > 0" class="border border-gray-200 dark:border-ocean-600 rounded-lg p-3 bg-gray-50 dark:bg-ocean-900/50 max-h-32 overflow-y-auto">
          <p class="text-xs text-gray-600 dark:text-ocean-300 mb-2">Select from existing tags:</p>
          <div class="flex flex-wrap gap-1.5">
            <button
                v-for="tag in availableTags"
                :key="tag.id"
                type="button"
                @click="selectExistingTag(tag.name)"
                :disabled="form.tags.includes(tag.name)"
                class="px-2 py-1 rounded-full text-xs font-medium transition-all shadow-sm"
                :class="form.tags.includes(tag.name)
                ? 'bg-blue-200 dark:bg-ocean-700 text-blue-700 dark:text-ocean-300 cursor-not-allowed'
                : 'bg-white dark:bg-ocean-800 text-gray-700 dark:text-ocean-200 border border-gray-300 dark:border-ocean-600 hover:bg-blue-50 dark:hover:bg-ocean-700 hover:border-blue-300 dark:hover:border-ocean-500 hover:shadow-md transform hover:scale-105'"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="errors.tags" class="text-red-500 dark:text-red-400 text-sm mt-1">
        {{ errors.tags }}
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:space-x-4">
      <button
          type="submit"
          :disabled="loading"
          class="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 dark:from-ocean-500 dark:to-ocean-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-ocean-600 dark:hover:to-ocean-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base font-medium"
      >
        {{ loading ? 'Saving...' : (isEdit ? 'Update' : 'Submit') }}
      </button>
      <router-link
          to="/proposals"
          class="w-full sm:w-auto bg-gray-200 dark:bg-ocean-700 text-gray-700 dark:text-ocean-200 px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-ocean-600 transition-all shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98] text-center text-sm sm:text-base font-medium"
      >
        Cancel
      </router-link>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { tagsApi } from '../api'
import { MAX_PROPOSAL_FILE_BYTES, MAX_PROPOSAL_FILE_MB, PROPOSAL_FILE_MIME } from '../config/proposals'
import { downloadProposalFile, proposalDownloadError } from '../utils/proposalDownload'

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

const isEdit = computed(() => !!props.proposal)
const tagInput = ref('')
const existingFile = ref(props.proposal?.file_path || null)
const downloadingFile = ref(false)
const downloadError = ref('')
const downloadExistingFile = async () => {
  if (!props.proposal?.id || downloadingFile.value) return
  downloadingFile.value = true
  downloadError.value = ''
  try {
    await downloadProposalFile(props.proposal.id, props.proposal.title)
  } catch (error) {
    downloadError.value = await proposalDownloadError(error)
  } finally {
    downloadingFile.value = false
  }
}
const fileError = ref('')
const fileInput = ref(null)
const clearSelectedFile = () => {
  form.value.file = null
  fileError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
const allTags = ref([])
const tagSearchQuery = ref('')

const form = ref({
  title: props.proposal?.title || '',
  description: props.proposal?.description || '',
  file: null,
  tags: props.proposal?.tags?.map(t => t.name) || [],
})

// Optimized: Only watch proposal.id to avoid deep watching
watch(
    () => props.proposal?.id,
    (newId, oldId) => {
      if (newId && newId !== oldId && props.proposal) {
        form.value = {
          title: props.proposal.title || '',
          description: props.proposal.description || '',
          file: null,
          tags: props.proposal.tags?.map(t => t.name) || [],
        }
        existingFile.value = props.proposal.file_path || null
        clearSelectedFile()
        tagInput.value = ''
        tagSearchQuery.value = ''
      }
    },
    { immediate: true }
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
  } catch (error) {}
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
  if (file.type !== PROPOSAL_FILE_MIME && !(file.type === '' && /\.pdf$/i.test(file.name))) {
    fileError.value = 'Only PDF files are allowed'
    form.value.file = null
    event.target.value = ''
    return
  }

  if (file.size > MAX_PROPOSAL_FILE_BYTES) {
    fileError.value = `File size must be at most ${MAX_PROPOSAL_FILE_MB}MB`
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
  if (props.loading || fileError.value) return
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
