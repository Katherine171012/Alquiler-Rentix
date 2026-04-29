<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  title: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'md',
  },
})

defineEmits(['close'])
</script>

<template>
  <div class="admin-modal" @click.self="$emit('close')">
    <div class="admin-modal__dialog" :class="`admin-modal__dialog--${size}`">
      <header class="admin-modal__header">
        <h2>{{ title }}</h2>
        <button type="button" class="admin-modal__close" @click="$emit('close')">
          <X :size="20" />
        </button>
      </header>

      <div class="admin-modal__body">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="admin-modal__footer">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<style scoped>
.admin-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(6px);
}

.admin-modal__dialog {
  width: min(100%, 48rem);
  max-height: calc(100vh - 2rem);
  overflow: auto;
  border-radius: 1.5rem;
  background: #fff;
  box-shadow: var(--shadow-lg);
}

.admin-modal__dialog--lg {
  width: min(100%, 64rem);
}

.admin-modal__dialog--xl {
  width: min(100%, 76rem);
}

.admin-modal__header,
.admin-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.admin-modal__footer {
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
  border-bottom: 0;
}

.admin-modal__header h2 {
  margin: 0;
  font-size: 1.8rem;
}

.admin-modal__close {
  display: inline-flex;
  border: 0;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.admin-modal__body {
  padding: 1.5rem;
}
</style>
