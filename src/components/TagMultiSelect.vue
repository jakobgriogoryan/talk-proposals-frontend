<template>
  <div ref="root" class="relative" @keydown.esc.stop.prevent="close(true)" @focusout="handleFocusOut">
    <button ref="trigger" type="button" :aria-expanded="open" :aria-controls="menuId" aria-haspopup="dialog" :aria-label="label" class="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-left text-sm text-gray-900 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-ocean-600 dark:bg-ocean-900 dark:text-ocean-100 dark:focus:ring-ocean-400/30" @click="toggle">
      <span class="truncate">{{ modelValue.length ? `${modelValue.length} tag${modelValue.length === 1 ? '' : 's'} selected` : 'Select tags...' }}</span>
      <svg aria-hidden="true" :class="['h-4 w-4 shrink-0 text-gray-500 dark:text-ocean-300 transition-transform', open && 'rotate-180']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
    </button>
    <div v-if="open" :id="menuId" role="dialog" :aria-label="label" class="absolute z-30 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-xl dark:border-ocean-600 dark:bg-ocean-800">
      <div class="border-b border-gray-200 p-2 dark:border-ocean-600">
        <input ref="searchInput" v-model="search" type="search" aria-label="Search tags" placeholder="Search tags..." class="min-h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-ocean-600 dark:bg-ocean-900 dark:text-ocean-100" />
      </div>
      <div class="max-h-48 overflow-y-auto rounded-b-lg p-1">
        <p v-if="!filteredOptions.length" class="px-3 py-3 text-sm text-gray-500 dark:text-ocean-300">No tags found</p>
        <label v-for="option in filteredOptions" :key="option.id" class="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-gray-800 hover:bg-blue-50 dark:text-ocean-100 dark:hover:bg-ocean-700">
          <input type="checkbox" :checked="modelValue.includes(option.id)" class="h-4 w-4 accent-blue-600 dark:accent-ocean-400" @change="toggleOption(option.id)" />
          <span class="break-words">{{ option.name }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, useId } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] },
  label: { type: String, default: 'Filter by tags' },
})
const emit = defineEmits(['update:modelValue', 'change'])
const root = ref(null)
const trigger = ref(null)
const searchInput = ref(null)
const open = ref(false)
const search = ref('')
const menuId = useId()
const filteredOptions = computed(() => props.options.filter(option => option.name.toLowerCase().includes(search.value.trim().toLowerCase())))
const close = (restoreFocus = false) => {
  open.value = false
  if (restoreFocus) trigger.value?.focus()
}
const toggle = async () => {
  open.value = !open.value
  if (open.value) {
    search.value = ''
    await nextTick()
    searchInput.value?.focus()
  }
}
const toggleOption = id => {
  const values = props.modelValue.includes(id) ? props.modelValue.filter(value => value !== id) : [...props.modelValue, id]
  emit('update:modelValue', values)
  emit('change', values)
}
const handleOutside = event => {
  if (!root.value?.contains(event.target)) close()
}
const handleFocusOut = event => {
  if (!root.value?.contains(event.relatedTarget)) close()
}
onMounted(() => document.addEventListener('pointerdown', handleOutside))
onUnmounted(() => document.removeEventListener('pointerdown', handleOutside))
</script>
