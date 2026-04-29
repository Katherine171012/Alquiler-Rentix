<script setup>
import { Search } from 'lucide-vue-next'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Buscar...',
  },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <label class="admin-search-bar">
    <Search :size="20" />
    <input
      :value="modelValue"
      type="search"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </label>
</template>

<style scoped>
.admin-search-bar {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-height: 3.5rem;
  padding: 0 1rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: #fff;
  color: var(--color-text-muted);
}

.admin-search-bar input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  color: var(--color-text);
}
</style>
