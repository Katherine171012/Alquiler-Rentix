<script setup>
defineEmits(['run'])

defineProps({
  actions: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="card">
    <header class="card__header">
      <h3>Actividad Rapida</h3>
    </header>
    <div class="actions">
      <button
        v-for="action in actions"
        :key="action.label"
        type="button"
        class="actions__button"
        :class="{ 'actions__button--primary': action.primary }"
        @click="$emit('run', action)"
      >
        {{ action.label }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.card {
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-surface);
  padding: 1rem;
}

.card__header h3 {
  margin: 0;
  font-size: 1rem;
}

.actions {
  margin-top: 1rem;
  display: grid;
  gap: 0.6rem;
}

.actions__button {
  height: 2.5rem;
  border-radius: 0.6rem;
  border: 1px solid #e4e7ec;
  background: #fff;
  cursor: pointer;
  font-weight: 500;
}

.actions__button--primary {
  border-color: transparent;
  color: #fff;
  background: #6a1230;
}
</style>
