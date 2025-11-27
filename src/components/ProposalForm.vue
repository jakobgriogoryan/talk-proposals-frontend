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
        class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
      ></textarea>
      <div v-if="errors.description" class="text-red-500 text-sm mt-1">
        {{ errors.description }}
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
        PDF File {{ isEdit ? '(optional)' : '*' }}
      </label>
      <input
        type="file"
        accept=".pdf"
        @change="handleFileChange"
        :required="!isEdit"
        class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <div v-if="errors.file" class="text-red-500 text-sm mt-1">
        {{ errors.file }}
      </div>
      <div v-if="existingFile" class="text-sm text-gray-600 mt-1">
        Current file: {{ existingFile }}
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
        Tags * (type and press Enter)
      </label>
      <div class="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
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
      <input
        v-model="tagInput"
        type="text"
        @keydown.enter.prevent="addTag"
        placeholder="Type tag name and press Enter"
        class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
      />
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
import { ref, watch } from 'vue'

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

const form = ref({
  title: props.proposal?.title || '',
  description: props.proposal?.description || '',
  file: null,
  tags: props.proposal?.tags?.map(t => t.name) || [],
})

const tagInput = ref('')
const existingFile = ref(props.proposal?.file_path || null)

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

const handleFileChange = (event) => {
  form.value.file = event.target.files[0]
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (index) => {
  form.value.tags.splice(index, 1)
}

const handleSubmit = () => {
  emit('submit', form.value)
}
</script>

