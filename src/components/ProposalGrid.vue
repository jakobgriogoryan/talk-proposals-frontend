<template>
  <!-- Paginated cards have variable heights; let CSS size rows from their content. -->
  <div data-testid="proposal-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-1 pt-3 pb-5">
    <div
      v-for="proposal in proposals"
      :key="proposal.id"
      class="min-w-0"
      :class="{ 'cursor-pointer': clickable }"
      @click="clickable && $emit('select', proposal.id)"
    >
      <ProposalCard :proposal="proposal" :show-actions="showActions" @delete="$emit('delete', $event)" />
    </div>
  </div>
</template>

<script setup>
import ProposalCard from './ProposalCard.vue'

defineProps({
  proposals: { type: Array, required: true },
  showActions: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
})
defineEmits(['delete', 'select'])
</script>
