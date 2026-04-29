<script setup>
defineProps({
  title: {
    type: String,
    default: 'Vehiculos por Categoria',
  },
  items: {
    type: Array,
    default: () => [],
  },
})

function ratio(count, total) {
  if (!total) return 0
  return Math.max(4, Math.round((count / total) * 100))
}
</script>

<template>
  <section class="card">
    <header class="card__header">
      <h3>{{ title }}</h3>
    </header>
    <ul class="category-list">
      <li v-for="item in items" :key="item.category" class="category-list__item">
        <div class="category-list__line">
          <span>{{ item.category }}</span>
          <strong>{{ item.count }}</strong>
        </div>
        <div class="category-list__track">
          <div class="category-list__fill" :style="{ width: `${ratio(item.count, items[0]?.count || 1)}%` }" />
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

.category-list {
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.65rem;
}

.category-list__line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
}

.category-list__track {
  height: 0.33rem;
  border-radius: 999px;
  background: #f1f5f9;
}

.category-list__fill {
  height: 100%;
  border-radius: 999px;
  background: #6a1230;
}
</style>
