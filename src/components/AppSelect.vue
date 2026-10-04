<template>
  <div :class="['relative', compact ? 'inline-block min-w-36' : 'w-full']">
    <select
      v-bind="$attrs"
      :id="id || inputId"
      :value="modelValue ?? ''"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      class="block w-full min-h-11 appearance-none rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-ocean-900 dark:text-ocean-100 [color-scheme:light] dark:[color-scheme:dark]"
      :class="error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/30 dark:border-ocean-600 dark:hover:border-ocean-500 dark:focus:border-ocean-400 dark:focus:ring-ocean-400/30'"
      @change="selectValue"
    >
      <option v-if="placeholder" value="" :disabled="required" class="bg-white text-gray-900 dark:bg-ocean-900 dark:text-ocean-100">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled" class="bg-white text-gray-900 dark:bg-ocean-900 dark:text-ocean-100">
        {{ option.label }}
      </option>
    </select>
    <svg aria-hidden="true" class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-ocean-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </div>
</template>

<script setup>
import { useId } from 'vue'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '' },
  id: { type: String, default: '' },
  required: Boolean,
  disabled: Boolean,
  compact: Boolean,
  error: { type: [Boolean, String, Array], default: false },
})
const emit = defineEmits(['update:modelValue', 'change'])
const inputId = useId()
const selectValue = event => {
  const value = props.options.find(option => String(option.value) === event.target.value)?.value ?? ''
  emit('update:modelValue', value)
  emit('change', value)
}
</script>
