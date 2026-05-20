<script setup>
import { computed, ref, watch } from 'vue'
import { ShieldCheck } from 'lucide-vue-next'
import { getCaptchaRequest } from '../services/auth.service'

const props = defineProps({
  required: { type: Boolean, default: false },
})

const emit = defineEmits(['update:token', 'update:answer'])

const challenge = ref(null)
const answer = ref('')
const loadError = ref('')
const isLoading = ref(false)

const question = computed(() => challenge.value?.question ?? '')

async function refreshChallenge() {
  loadError.value = ''
  isLoading.value = true
  answer.value = ''
  emit('update:answer', '')

  try {
    const response = await getCaptchaRequest()
    const data = response?.data ?? {}

    challenge.value = {
      token: data.token ?? data.captchaToken ?? '',
      question: data.question ?? data.prompt ?? data.challenge ?? '',
    }

    if (!challenge.value.token || !challenge.value.question) {
      throw new Error('Captcha inválido del servidor')
    }

    emit('update:token', challenge.value.token)
  } catch {
    challenge.value = null
    loadError.value = 'No se pudo cargar el captcha. Intenta de nuevo.'
    emit('update:token', '')
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.required,
  (required) => {
    if (required) refreshChallenge()
    else {
      challenge.value = null
      answer.value = ''
      emit('update:token', '')
      emit('update:answer', '')
    }
  },
  { immediate: true },
)

watch(answer, (value) => {
  emit('update:answer', value)
})
</script>

<template>
  <div v-if="required" class="login-captcha">
    <div class="login-captcha__header">
      <ShieldCheck :size="18" />
      <strong>Captcha</strong>
    </div>

    <p v-if="loadError" class="login-captcha__error">{{ loadError }}</p>

    <label v-else class="login-captcha__field">
      <span>¿Cuánto es {{ question }}?</span>
      <input
        v-model="answer"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        placeholder="Respuesta"
        :disabled="isLoading || !challenge"
        required
      />
    </label>

    <button
      type="button"
      class="login-captcha__refresh"
      :disabled="isLoading"
      @click="refreshChallenge"
    >
      {{ isLoading ? 'Cargando…' : 'Cambiar captcha' }}
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

.login-captcha__error {
  margin: 0;
  font-size: 0.9rem;
  color: #b42318;
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

.login-captcha__refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
