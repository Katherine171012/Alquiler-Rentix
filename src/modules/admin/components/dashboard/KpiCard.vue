<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  helper: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <article class="kpi-card">
    <div class="kpi-card__icon" v-if="icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path :d="icon" />
      </svg>
    </div>
    <p class="kpi-card__title">{{ title }}</p>
    <p class="kpi-card__value">{{ value }}</p>
    <p v-if="helper" class="kpi-card__helper">{{ helper }}</p>
  </article>
</template>

<style scoped>
.kpi-card {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-surface);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
}

.kpi-card__title {
  margin: 0;
  color: #667085;
  font-size: 0.875rem;
}

.kpi-card__icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  display: grid;
  place-items: center;
  background: #f4ebff;
}

.kpi-card__icon svg {
  width: 1rem;
  height: 1rem;
  fill: #6a1230;
}

.kpi-card__value {
  margin: 0.5rem 0 0;
  font-size: 1.9rem;
  font-weight: 700;
  color: #111827;
}

.kpi-card__helper {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  color: #475467;
}
</style>
