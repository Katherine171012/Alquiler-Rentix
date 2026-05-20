<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertTriangle, CarFront, LockKeyhole, Mail } from 'lucide-vue-next'
import { ROLES } from '../../../core/constants/roles'
import { formatLockoutCountdown } from '../../../core/security/login-security.mapper'
import { useAuthStore } from '../../../stores/auth.store'
import LoginAttemptTracker from '../components/LoginAttemptTracker.vue'
import LoginCaptcha from '../components/LoginCaptcha.vue'

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
const securityInfo = ref(null)
const captchaToken = ref('')
const captchaAnswer = ref('')
const lockoutRemainingSeconds = ref(0)
let lockoutTimer = null

const normalizedUsername = computed(() => {
  const raw = form.username.trim()
  if (!raw) return ''
  return raw.includes('@') ? raw.split('@')[0] : raw
})

const requiresCaptcha = computed(() => securityInfo.value?.requiresCaptcha ?? false)

const suspiciousAlert = computed(() => securityInfo.value?.suspicious ?? false)

const failedAttempts = computed(() => securityInfo.value?.failedAttempts ?? 0)

const maxFailedAttempts = computed(() => securityInfo.value?.maxFailedAttempts ?? 5)

const isLocked = computed(() => securityInfo.value?.locked ?? false)

const isAccountLocked = computed(() => isLocked.value && (securityInfo.value?.httpStatus === 423 || lockoutRemainingSeconds.value > 0))

const showAttemptTracker = computed(() => failedAttempts.value > 0 || isLocked.value)

const lockoutCountdownLabel = computed(() => formatLockoutCountdown(lockoutRemainingSeconds.value))

const formDisabled = computed(() => isLoading.value || isAccountLocked.value)

function clearLockoutTimer() {
  if (lockoutTimer) {
    clearInterval(lockoutTimer)
    lockoutTimer = null
  }
}

function startLockoutCountdown(seconds) {
  clearLockoutTimer()
  const initial = Math.max(0, Math.floor(Number(seconds) || 0))
  if (initial <= 0) return

  lockoutRemainingSeconds.value = initial
  lockoutTimer = setInterval(() => {
    if (lockoutRemainingSeconds.value <= 1) {
      lockoutRemainingSeconds.value = 0
      clearLockoutTimer()
      if (securityInfo.value) {
        securityInfo.value = { ...securityInfo.value, locked: false }
      }
      return
    }
    lockoutRemainingSeconds.value -= 1
  }, 1000)
}

function applySecurityState(security) {
  securityInfo.value = security ?? null

  if (security?.locked && security.lockoutRemainingSeconds > 0) {
    startLockoutCountdown(security.lockoutRemainingSeconds)
  } else {
    lockoutRemainingSeconds.value = 0
    clearLockoutTimer()
  }
}

function resolveRedirectByRole() {
  if (authStore.hasAnyRole([ROLES.ADMIN, ROLES.VENDEDOR])) {
    return '/panel'
  }

  return '/mi-cuenta/perfil'
}

onBeforeUnmount(() => {
  clearLockoutTimer()
})

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

  if (isAccountLocked.value) {
    message.value =
      securityInfo.value?.message ||
      `Cuenta bloqueada temporalmente. Intenta en ${lockoutCountdownLabel.value || 'unos minutos'}.`
    return
  }

  if (requiresCaptcha.value && !captchaAnswer.value.trim()) {
    message.value = 'Completa el captcha de seguridad.'
    return
  }

  isLoading.value = true

  try {
    const username = normalizedUsername.value

    const response = await authStore.login(
      {
        username,
        password: form.password,
      },
      {
        captchaToken: captchaToken.value,
        captchaAnswer: captchaAnswer.value,
      },
    )

    if (response?.security?.cleared) {
      applySecurityState(null)
    } else if (response?.security) {
      applySecurityState(response.security)
    }

    if (!response?.success) {
      const status = response?.status ?? response?.security?.httpStatus ?? 0

      if (status === 423) {
        message.value =
          response?.message ||
          `Cuenta bloqueada temporalmente. Intenta en ${lockoutCountdownLabel.value || 'unos minutos'}.`
      } else {
        message.value = response?.message ?? 'Credenciales incorrectas.'
      }

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
      <LoginAttemptTracker
        v-if="showAttemptTracker"
        :failed-attempts="failedAttempts"
        :max-failed-attempts="maxFailedAttempts"
        :locked="isLocked"
      />

      <form class="auth-form" @submit.prevent="onSubmit">
        <div v-if="isAccountLocked" class="auth-alert auth-alert--locked">
          <LockKeyhole :size="18" />
          <div>
            <strong>Cuenta bloqueada temporalmente</strong>
            <p>
              {{ securityInfo?.message || 'Demasiados intentos fallidos.' }}
              <span v-if="lockoutCountdownLabel"> Podrás intentar de nuevo en {{ lockoutCountdownLabel }}.</span>
            </p>
          </div>
        </div>

        <div v-else-if="suspiciousAlert" class="auth-alert">
          <AlertTriangle :size="18" />
          <div>
            <strong>Actividad sospechosa detectada</strong>
            <p>Detectamos varios intentos fallidos en esta cuenta.</p>
          </div>
        </div>

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
              :disabled="formDisabled"
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
              :disabled="formDisabled"
            />
          </div>
        </label>

        <LoginCaptcha
          :required="requiresCaptcha && !isAccountLocked"
          @update:token="captchaToken = $event"
          @update:answer="captchaAnswer = $event"
        />

        <p v-if="message" class="auth-message" :class="{ 'auth-message--locked': isAccountLocked }">
          {{ message }}
        </p>

        <ul v-if="errors.length" class="auth-errors">
          <li v-for="(error, index) in errors" :key="`${error}-${index}`">{{ error }}</li>
        </ul>

        <button class="auth-submit" type="submit" :disabled="formDisabled">
          {{
            isLoading
              ? 'Validando…'
              : isAccountLocked
                ? 'Cuenta bloqueada'
                : 'Iniciar sesión'
          }}
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

.auth-alert {
  display: flex;
  gap: 0.65rem;
  padding: 0.9rem 1rem;
  border-radius: 0.9rem;
  background: #fff4e5;
  border: 1px solid #f5c26b;
  color: #8a4b00;
}

.auth-alert--locked {
  background: #fde8e8;
  border-color: #f5a8a8;
  color: #7f1d1d;
}

.auth-alert strong {
  display: block;
  margin-bottom: 0.2rem;
}

.auth-alert p {
  margin: 0;
  font-size: 0.9rem;
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

.auth-message--locked {
  color: #7f1d1d;
  font-weight: 600;
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
