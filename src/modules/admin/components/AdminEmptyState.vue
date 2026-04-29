<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="admin-empty-state">
    <div class="admin-empty-state__icon">
      <slot name="icon">-</slot>
    </div>
    <h3>{{ title }}</h3>
    <p v-if="description">{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.admin-empty-state {
  display: grid;
  justify-items: center;
  gap: 0.85rem;
  padding: 3rem 1.25rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 1.25rem;
  background: var(--color-surface-muted);
  text-align: center;
}

.admin-empty-state__icon {
  display: grid;
  height: 4rem;
  width: 4rem;
  place-items: center;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.admin-empty-state h3,
.admin-empty-state p {
  margin: 0;
}

.admin-empty-state p {
  max-width: 36rem;
  color: var(--color-text-muted);
}
</style>
