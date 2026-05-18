<script setup>
import { computed, ref, watch } from 'vue'
import { ShieldCheck } from 'lucide-vue-next'
import { createCaptchaChallenge } from '../../../core/security/auth-security.service.js'

const props = defineProps({
  required: { type: Boolean, default: false },
})

const emit = defineEmits(['update:token', 'update:answer'])

const challenge = ref(createCaptchaChallenge())
const answer = ref('')

const question = computed(() => challenge.value?.question ?? '')

function refreshChallenge() {
  challenge.value = createCaptchaChallenge()
  answer.value = ''
  emit('update:token', challenge.value.token)
  emit('update:answer', '')
}

watch(
  () => props.required,
  (required) => {
    if (required) refreshChallenge()
  },
  { immediate: true },
)

watch(answer, (value) => {
  emit('update:answer', value)
})

watch(
  () => challenge.value?.token,
  (token) => {
    emit('update:token', token ?? '')
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="required" class="login-captcha">
    <div class="login-captcha__header">
      <ShieldCheck :size="18" />
      <strong>Verificación requerida</strong>
    </div>
    <p class="login-captcha__hint">
      Tras varios intentos fallidos, confirma que no eres un robot.
    </p>
    <label class="login-captcha__field">
      <span>¿Cuánto es {{ question }}?</span>
      <input
        v-model="answer"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        placeholder="Respuesta"
        required
      />
    </label>
    <button type="button" class="login-captcha__refresh" @click="refreshChallenge">
      Generar otro captcha
    </button>
  </div>
</template>

<style scoped>
.login-captcha {
  padding: 1rem;
  border-radius: 1rem;
  border: 1px dashed #c4a3b0;
  background: #fdf7f9;
  display: grid;
  gap: 0.65rem;
}

.login-captcha__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #7b173b;
}

.login-captcha__hint {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.login-captcha__field {
  display: grid;
  gap: 0.4rem;
}

.login-captcha__field input {
  height: 2.8rem;
  padding: 0 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
}

.login-captcha__refresh {
  justify-self: start;
  border: none;
  background: none;
  color: var(--color-primary);
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
}
</style>
