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
  <header class="admin-page-header">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>

    <div class="admin-page-header__actions">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.admin-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.admin-page-header h1,
.admin-page-header p {
  margin: 0;
}

.admin-page-header h1 {
  font-size: clamp(2rem, 3vw, 2.35rem);
}

.admin-page-header p {
  margin-top: 0.35rem;
  color: var(--color-text-muted);
}

.admin-page-header__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 720px) {
  .admin-page-header {
    flex-direction: column;
  }

  .admin-page-header__actions {
    width: 100%;
    justify-content: stretch;
  }
}
</style>
