<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' }).format(date)
}
</script>

<template>
  <section class="card">
    <header class="card__header">
      <h3>Reservas Recientes</h3>
    </header>
    <ul class="list">
      <li v-for="item in items" :key="item.id" class="list__item">
        <div>
          <p class="list__title">{{ item.vehicleName }}</p>
          <p class="list__subtitle">{{ item.clientName }}</p>
        </div>
        <div class="list__meta">
          <strong>{{ item.amount }}</strong>
          <span>{{ formatDate(item.date) }}</span>
          <span class="badge" :data-variant="item.statusVariant">{{ item.status }}</span>
        </div>
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

.list {
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.list__item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  border-top: 1px solid #f0f1f3;
}

.list__item:first-child {
  border-top: none;
  padding-top: 0;
}

.list__title {
  margin: 0;
  font-weight: 600;
}

.list__subtitle {
  margin: 0.25rem 0 0;
  color: #667085;
  font-size: 0.85rem;
}

.list__meta {
  display: grid;
  justify-items: end;
  align-content: center;
  gap: 0.2rem;
}

.list__meta span {
  font-size: 0.78rem;
  color: #667085;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 5.5rem;
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
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
