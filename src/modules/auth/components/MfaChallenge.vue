<script setup>
import { ref, watch } from 'vue'
import { Smartphone } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:code'])

const code = ref('')

watch(code, (value) => {
  emit('update:code', value.replace(/\D/g, '').slice(0, 6))
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) code.value = ''
  },
)
</script>

<template>
  <div v-if="visible" class="mfa-challenge">
    <div class="mfa-challenge__header">
      <Smartphone :size="18" />
      <strong>Verificación MFA</strong>
    </div>
    <label class="mfa-challenge__field">
      <span>Código de 6 dígitos</span>
      <input
        v-model="code"
        type="text"
        inputmode="numeric"
        maxlength="6"
        autocomplete="one-time-code"
        placeholder="000000"
        required
      />
    </label>
  </div>
</template>

<style scoped>
.mfa-challenge {
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid #d4e4ff;
  background: #f5f9ff;
  display: grid;
  gap: 0.65rem;
}

.mfa-challenge__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1d4ed8;
}

.mfa-challenge__field {
  display: grid;
  gap: 0.4rem;
}

.mfa-challenge__field input {
  height: 2.8rem;
  padding: 0 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  letter-spacing: 0.35em;
  font-size: 1.1rem;
}
</style>
