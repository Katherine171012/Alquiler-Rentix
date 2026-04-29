<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CarFront, LockKeyhole, Mail } from 'lucide-vue-next'
import { ROLES } from '../../../core/constants/roles'
import { useAuthStore } from '../../../stores/auth.store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: '',
})

const isLoading = ref(false)
const message = ref('')
const errors = ref([])

function resolveRedirectByRole() {
  if (authStore.hasAnyRole([ROLES.ADMIN, ROLES.VENDEDOR])) {
    return '/panel'
  }

  return '/mi-cuenta/perfil'
}

async function onSubmit() {
  message.value = ''
  errors.value = []

  if (!form.username.trim()) {
    message.value = 'Ingresa tu usuario o correo electrónico.'
    return
  }

  if (!form.password) {
    message.value = 'Ingresa tu contraseña.'
    return
  }

  isLoading.value = true

  try {
    const rawUsername = form.username.trim()
    const normalizedUsername = rawUsername.includes('@') ? rawUsername.split('@')[0] : rawUsername

    const response = await authStore.login({
      username: normalizedUsername,
      password: form.password,
    })

    if (!response?.success) {
      message.value = response?.message ?? 'No se pudo iniciar sesión.'
      errors.value = Array.isArray(response?.errors) ? response.errors : []
      return
    }

    const redirectTarget =
      typeof route.query.redirect === 'string' && route.query.redirect.trim()
        ? route.query.redirect
        : resolveRedirectByRole()

    await router.push(redirectTarget)
  } catch (error) {
    message.value = error?.message ?? 'No se pudo iniciar sesión.'
    errors.value = Array.isArray(error?.errors) ? error.errors : []
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="auth-shell">
    <div class="auth-shell__hero">
      <div class="auth-shell__brand">
        <span class="auth-shell__logo"><CarFront :size="26" /></span>
        <strong>Rentix Autos</strong>
      </div>
      <h1>Bienvenido</h1>
      <p>Inicia sesión para continuar con tu reserva en Ecuador.</p>
    </div>

    <article class="auth-card">
      <form class="auth-form" @submit.prevent="onSubmit">
        <label class="auth-field">
          <span>Usuario o correo electrónico</span>
          <div class="auth-input">
            <Mail :size="20" />
            <input
              v-model="form.username"
              type="text"
              name="username"
              placeholder="Ingresa tu usuario o correo"
              autocomplete="username"
              required
              :disabled="isLoading"
            />
          </div>
        </label>

        <label class="auth-field">
          <span>Contraseña</span>
          <div class="auth-input">
            <LockKeyhole :size="20" />
            <input
              v-model="form.password"
              type="password"
              name="password"
              placeholder="Ingresa tu contraseña"
              autocomplete="current-password"
              required
              :disabled="isLoading"
            />
          </div>
        </label>

        <p v-if="message" class="auth-message">{{ message }}</p>

        <ul v-if="errors.length" class="auth-errors">
          <li v-for="(error, index) in errors" :key="`${error}-${index}`">{{ error }}</li>
        </ul>

        <button class="auth-submit" type="submit" :disabled="isLoading">
          {{ isLoading ? 'Ingresando...' : 'Iniciar sesión' }}
        </button>
      </form>

      <div class="auth-links">
        <RouterLink to="/registro">¿No tienes cuenta? Regístrate aquí</RouterLink>
        <RouterLink to="/">Volver al inicio</RouterLink>
      </div>
    </article>
  </section>
</template>

<style scoped>
.auth-shell {
  min-height: calc(100vh - 72px);
  display: grid;
  place-items: start center;
  padding: 2.5rem 1rem 5rem;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 28%),
    linear-gradient(180deg, #731733 0%, #5e112a 100%);
}

.auth-shell__hero {
  color: #fff;
  text-align: center;
  margin-bottom: 2rem;
}

.auth-shell__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.auth-shell__logo {
  width: 62px;
  height: 62px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: #fff;
  color: var(--color-primary);
}

.auth-shell__hero h1 {
  margin: 0;
  font-size: clamp(2.3rem, 4vw, 3.5rem);
}

.auth-shell__hero p {
  margin: 0.75rem 0 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 1.1rem;
}

.auth-card {
  width: min(100%, 560px);
  padding: 2rem;
  border-radius: 1.6rem;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: var(--shadow-lg);
}

.auth-form {
  display: grid;
  gap: 1.2rem;
}

.auth-field {
  display: grid;
  gap: 0.55rem;
}

.auth-field span {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
}

.auth-input {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  height: 3.8rem;
  padding: 0 1rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
}

.auth-input svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.auth-input input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 1rem;
  background: transparent;
}

.auth-message,
.auth-errors {
  margin: 0;
  color: #b42318;
}

.auth-errors {
  padding-left: 1.2rem;
}

.auth-submit {
  height: 3.7rem;
  border: none;
  border-radius: 1rem;
  color: #fff;
  background: linear-gradient(135deg, #7b173b, #571027);
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
}

.auth-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-links {
  margin-top: 1.8rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  display: grid;
  gap: 0.7rem;
  justify-items: center;
}

.auth-links a {
  color: var(--color-primary);
  text-decoration: none;
}
</style>
