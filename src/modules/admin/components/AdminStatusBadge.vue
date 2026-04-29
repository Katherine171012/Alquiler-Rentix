<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  tone: {
    type: String,
    default: 'neutral',
  },
})

const toneClass = computed(() => `admin-status-badge--${props.tone}`)
</script>

<template>
  <span class="admin-status-badge" :class="toneClass">{{ label }}</span>
</template>

<style scoped>
.admin-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 6rem;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 600;
}

.admin-status-badge--success {
  background: #dcfce7;
  color: #15803d;
}

.admin-status-badge--warning {
  background: #fef3c7;
  color: #b45309;
}

.admin-status-badge--danger {
  background: #fee2e2;
  color: #b91c1c;
}

.admin-status-badge--info {
  background: #dbeafe;
  color: #2563eb;
}

.admin-status-badge--neutral {
  background: #f3f4f6;
  color: #475467;
}
</style>
