<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CarFront,
  FileText,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-vue-next'
import { registerCliente } from '../../../api/auth.api'
import { useAuthStore } from '../../../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  tipoIdentificacion: 'CED',
  numeroIdentificacion: '',
  direccion: '',
  password: '',
  confirmPassword: '',
  aceptaTerminos: false,
})

const isLoading = ref(false)
const message = ref('')
const errors = ref([])

async function onSubmit() {
  message.value = ''
  errors.value = []

  if (form.password !== form.confirmPassword) {
    message.value = 'Las contraseñas no coinciden.'
    return
  }

  if (!form.aceptaTerminos) {
    message.value = 'Debes aceptar los términos para continuar.'
    return
  }

  isLoading.value = true

  try {
    const payload = {
      username: form.username.trim(),
      correo: form.correo,
      password: form.password,
      cliTipoIdentificacion: form.tipoIdentificacion,
      cliNumeroIdentificacion: form.numeroIdentificacion,
      cliNombres: form.nombres,
      cliApellidos: form.apellidos,
      cliRazonSocial: null,
      cliCorreoElectronico: form.correo,
      cliTelefono: form.telefono,
      cliDireccion: form.direccion,
      cliEsPersonaJuridica: false,
    }

    const response = await registerCliente(payload)

    if (!response?.success) {
      message.value = response?.message ?? 'No se pudo completar el registro.'
      errors.value = Array.isArray(response?.errors) ? response.errors : []
      return
    }

    authStore.setSession({
      token: response?.data?.token,
      user: {
        idUsuario: response?.data?.idUsuario,
        username: response?.data?.username,
        correo: response?.data?.correo ?? form.correo,
      },
      roles: response?.data?.roles ?? ['CLIENTE'],
      expirationUtc: response?.data?.expirationUtc ?? null,
    })

    await router.push('/mi-cuenta/perfil')
  } catch (error) {
    message.value = error?.message ?? 'No se pudo completar el registro.'
    errors.value = Array.isArray(error?.errors) ? error.errors : []
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="register-shell">
    <div class="register-shell__hero">
      <div class="register-shell__brand">
        <span class="register-shell__logo"><CarFront :size="26" /></span>
        <strong>Rentix Autos</strong>
      </div>
      <h1>Crear cuenta</h1>
      <p>Completa tus datos para alquilar vehículos en Ecuador</p>
    </div>

    <article class="register-card">
      <form class="register-form" @submit.prevent="onSubmit">
        <section class="register-section">
          <h2>Información personal</h2>
          <div class="register-grid">
            <label class="register-field">
              <span>Usuario *</span>
              <div class="register-input">
                <UserRound :size="20" />
                <input v-model="form.username" type="text" placeholder="Crea tu usuario" required />
              </div>
            </label>

            <label class="register-field">
              <span>Nombre *</span>
              <div class="register-input">
                <UserRound :size="20" />
                <input v-model="form.nombres" type="text" placeholder="Ingresa tu nombre" required />
              </div>
            </label>

            <label class="register-field">
              <span>Apellido</span>
              <div class="register-input">
                <UserRound :size="20" />
                <input v-model="form.apellidos" type="text" placeholder="Ingresa tu apellido" />
              </div>
            </label>

            <label class="register-field">
              <span>Correo electrónico *</span>
              <div class="register-input">
                <Mail :size="20" />
                <input v-model="form.correo" type="email" placeholder="tu.correo@ejemplo.com" required />
              </div>
            </label>

            <label class="register-field">
              <span>Teléfono</span>
              <div class="register-input">
                <Phone :size="20" />
                <input v-model="form.telefono" type="text" placeholder="+593 98 765 4321" />
              </div>
            </label>

            <label class="register-field">
              <span>Tipo de identificación</span>
              <div class="register-input">
                <select v-model="form.tipoIdentificacion">
                  <option value="CED">Cédula</option>
                  <option value="PAS">Pasaporte</option>
                  <option value="RUC">RUC</option>
                </select>
              </div>
            </label>

            <label class="register-field">
              <span>Número de identificación *</span>
              <div class="register-input">
                <FileText :size="20" />
                <input
                  v-model="form.numeroIdentificacion"
                  type="text"
                  placeholder="Ingresa tu número de identificación"
                  required
                />
              </div>
            </label>
          </div>
        </section>

        <section class="register-section">
          <h2>Dirección</h2>
          <div class="register-grid">
            <label class="register-field register-field--full">
              <span>Dirección</span>
              <div class="register-input">
                <MapPin :size="20" />
                <input v-model="form.direccion" type="text" placeholder="Ej. Av. Amazonas y Eloy Alfaro, Quito" />
              </div>
            </label>
          </div>
        </section>

        <section class="register-section">
          <h2>Seguridad</h2>
          <div class="register-grid">
            <label class="register-field">
              <span>Contraseña *</span>
              <div class="register-input">
                <LockKeyhole :size="20" />
                <input v-model="form.password" type="password" placeholder="Crea una contraseña segura" required />
              </div>
            </label>

            <label class="register-field">
              <span>Confirmar contraseña *</span>
              <div class="register-input">
                <LockKeyhole :size="20" />
                <input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>
            </label>
          </div>
        </section>

        <label class="register-check">
          <input v-model="form.aceptaTerminos" type="checkbox" />
          <span>Acepto los términos y condiciones y la política de privacidad</span>
        </label>

        <p v-if="message" class="register-message">{{ message }}</p>
        <ul v-if="errors.length" class="register-errors">
          <li v-for="(error, index) in errors" :key="`${error}-${index}`">{{ error }}</li>
        </ul>

        <button class="register-submit" type="submit" :disabled="isLoading">
          {{ isLoading ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>

        <p class="register-links">
          ¿Ya tienes cuenta?
          <RouterLink to="/login">Iniciar sesión</RouterLink>
        </p>
      </form>
    </article>
  </section>
</template>

<style scoped>
.register-shell {
  padding: 2.5rem 1rem 4.5rem;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 28%),
    linear-gradient(180deg, #731733 0%, #5e112a 100%);
}

.register-shell__hero {
  text-align: center;
  color: #fff;
  margin-bottom: 2rem;
}

.register-shell__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.register-shell__logo {
  width: 62px;
  height: 62px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: #fff;
  color: var(--color-primary);
}

.register-shell__hero h1 {
  margin: 0;
  font-size: clamp(2.3rem, 4vw, 3.5rem);
}

.register-shell__hero p {
  margin: 0.75rem 0 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 1.1rem;
}

.register-card {
  width: min(100%, 1120px);
  margin: 0 auto;
  padding: 2.2rem;
  border-radius: 1.8rem;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: var(--shadow-lg);
}

.register-form {
  display: grid;
  gap: 1.75rem;
}

.register-section {
  display: grid;
  gap: 1rem;
}

.register-section h2 {
  margin: 0;
  font-size: 1.15rem;
}

.register-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}

.register-field {
  display: grid;
  gap: 0.55rem;
}

.register-field--full {
  grid-column: 1 / -1;
}

.register-field span {
  font-size: 0.95rem;
  font-weight: 700;
}

.register-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.75rem;
  padding: 0 1rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
}

.register-input svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.register-input input,
.register-input select {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1rem;
}

.register-check {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: var(--color-text-soft);
}

.register-message,
.register-errors {
  margin: 0;
  color: #b42318;
}

.register-errors {
  padding-left: 1.2rem;
}

.register-submit {
  height: 3.7rem;
  border: none;
  border-radius: 1rem;
  color: #fff;
  background: linear-gradient(135deg, #7b173b, #571027);
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
}

.register-links {
  margin: 0;
  text-align: center;
  color: var(--color-text-muted);
}

.register-links a {
  color: var(--color-primary);
  text-decoration: none;
}

@media (max-width: 760px) {
  .register-card {
    padding: 1.3rem;
  }

  .register-grid {
    grid-template-columns: 1fr;
  }
}
</style>
