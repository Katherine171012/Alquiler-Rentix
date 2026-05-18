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
      <strong>Autenticación multifactor (MFA)</strong>
    </div>
    <p class="mfa-challenge__hint">
      Ingresa el código de 6 dígitos de tu app autenticadora.
      <span class="mfa-challenge__demo">Demo: usa cualquier código de 6 números.</span>
    </p>
    <label class="mfa-challenge__field">
      <span>Código MFA</span>
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
    <p class="mfa-challenge__policy">
      Política simulada: bloqueo 15 min tras 5 fallos · captcha desde el 3.er intento · logs en consola.
    </p>
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

.mfa-challenge__hint {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.mfa-challenge__demo {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
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

.mfa-challenge__policy {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
