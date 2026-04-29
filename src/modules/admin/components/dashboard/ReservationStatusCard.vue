<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="card">
    <header class="card__header">
      <h3>Estados de Reservas</h3>
    </header>
    <ul class="status-list">
      <li v-for="item in items" :key="item.code" class="status-list__item">
        <span class="badge" :data-variant="item.variant">{{ item.label }}</span>
        <strong>{{ item.count }}</strong>
      </li>
    </ul>
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

.status-list {
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.6rem;
}

.status-list__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.78rem;
}

.badge[data-variant='success'] {
  background: #dcfce7;
  color: #166534;
}

.badge[data-variant='warning'] {
  background: #fef9c3;
  color: #854d0e;
}

.badge[data-variant='info'] {
  background: #dbeafe;
  color: #1e40af;
}

.badge[data-variant='danger'] {
  background: #fee2e2;
  color: #b91c1c;
}

.badge[data-variant='neutral'] {
  background: #f3f4f6;
  color: #374151;
}
</style>
