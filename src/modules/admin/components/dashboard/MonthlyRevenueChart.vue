<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const maxValue = computed(() => Math.max(...props.items.map((item) => Number(item.total) || 0), 0))

function toPercent(value) {
  if (!maxValue.value) return 0
  return Math.max(6, Math.round((Number(value) / maxValue.value) * 100))
}
</script>

<template>
  <section class="card">
    <header class="card__header">
      <h3>Ingresos Mensuales</h3>
    </header>
    <div class="chart">
      <div v-for="item in items" :key="item.key" class="chart__bar-wrap">
        <div class="chart__bar" :style="{ height: `${toPercent(item.total)}%` }" />
        <span class="chart__label">{{ item.label }}</span>
      </div>
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

.chart {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(56px, 1fr));
  gap: 0.75rem;
  min-height: 220px;
  align-items: end;
}

.chart__bar-wrap {
  display: grid;
  justify-items: center;
  gap: 0.35rem;
}

.chart__bar {
  width: 100%;
  max-width: 42px;
  border-radius: 0.5rem 0.5rem 0.2rem 0.2rem;
  background: linear-gradient(180deg, #7f1d4a 0%, #5f1237 100%);
  min-height: 12px;
}

.chart__label {
  font-size: 0.75rem;
  color: #667085;
  text-transform: capitalize;
}
</style>
