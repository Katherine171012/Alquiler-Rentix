<script setup>
import { computed, onMounted, ref } from 'vue'
import { FileText, Mail, MapPin, Phone, Shield, UserRound } from 'lucide-vue-next'
import { useAuthStore } from '../../../stores/auth.store'
import { getClientEmail, getUserDisplayName, resolveCurrentClient } from '../services/clientPortal.service'

const authStore = useAuthStore()

const cargando = ref(true)
const error = ref('')
const perfil = ref(null)

const nombreCompleto = computed(() => getUserDisplayName(authStore.user, perfil.value))
const correo = computed(() => getClientEmail(authStore.user, perfil.value))
const inicial = computed(() => nombreCompleto.value.charAt(0).toUpperCase())

async function cargarPerfil() {
  try {
    cargando.value = true
    perfil.value = await resolveCurrentClient(authStore.user)
  } catch (err) {
    error.value = err?.message ?? 'No se pudo cargar tu perfil.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargarPerfil)
</script>

<template>
  <section class="perfil-view">
    <header class="perfil-hero">
      <div class="perfil-hero__inner">
        <h1>Mi perfil</h1>
        <p>Administra tu información personal y tus datos de contacto</p>
      </div>
    </header>

    <div class="perfil-view__inner">
      <p v-if="cargando" class="feedback">Cargando perfil...</p>
      <p v-else-if="error" class="feedback feedback--error">{{ error }}</p>

      <article v-else class="perfil-card">
        <div class="perfil-card__top">
          <div class="perfil-card__identity">
            <span class="perfil-card__avatar">{{ inicial }}</span>
            <div>
              <h2>{{ nombreCompleto }}</h2>
              <p>{{ correo }}</p>
              <span class="perfil-card__badge">Cliente</span>
            </div>
          </div>

          <button type="button" class="perfil-card__button">Editar perfil</button>
        </div>

        <div class="perfil-section">
          <h3>Información personal</h3>

          <div class="perfil-grid">
            <article class="perfil-info">
              <span><UserRound :size="20" /></span>
              <div>
                <small>Nombre completo</small>
                <strong>{{ nombreCompleto }}</strong>
              </div>
            </article>

            <article class="perfil-info">
              <span><Mail :size="20" /></span>
              <div>
                <small>Correo electrónico</small>
                <strong>{{ correo || 'Sin correo registrado' }}</strong>
              </div>
            </article>

            <article class="perfil-info">
              <span><Phone :size="20" /></span>
              <div>
                <small>Teléfono</small>
                <strong>{{ perfil?.cliTelefono || 'No registrado' }}</strong>
              </div>
            </article>

            <article class="perfil-info">
              <span><FileText :size="20" /></span>
              <div>
                <small>Identificación</small>
                <strong>
                  {{ [perfil?.cliTipoIdentificacion, perfil?.cliNumeroIdentificacion].filter(Boolean).join(' - ') || 'No registrada' }}
                </strong>
              </div>
            </article>

            <article class="perfil-info perfil-info--full">
              <span><MapPin :size="20" /></span>
              <div>
                <small>Dirección</small>
                <strong>{{ perfil?.cliDireccion || 'Sin dirección registrada' }}</strong>
              </div>
            </article>
          </div>
        </div>

        <div class="perfil-section perfil-section--security">
          <h3>Seguridad</h3>
          <button type="button" class="perfil-security">
            <Shield :size="18" />
            Cambiar contraseña
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.perfil-view {
  background: linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%);
}

.perfil-hero {
  background: linear-gradient(120deg, #4d0d24, #6a1230 55%, #4a0b22 100%);
  color: #fff;
  padding: 2.5rem 0 3.4rem;
}

.perfil-hero__inner,
.perfil-view__inner {
  width: min(100%, 1520px);
  margin: 0 auto;
  padding: 0 1.25rem;
}

.perfil-hero h1 {
  margin: 0;
  font-size: clamp(2.8rem, 5vw, 4.2rem);
}

.perfil-hero p {
  margin: 0.8rem 0 0;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
}

.perfil-view__inner {
  padding-top: 2.2rem;
  padding-bottom: 3rem;
}

.perfil-card {
  width: min(100%, 1040px);
  margin: 0 auto;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1.7rem;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.perfil-card__top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 2rem;
  color: #fff;
  background: linear-gradient(135deg, #6a1230, #4d0d24);
}

.perfil-card__identity {
  display: flex;
  align-items: center;
  gap: 1.4rem;
}

.perfil-card__avatar {
  width: 120px;
  height: 120px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.18);
  font-size: 3rem;
}

.perfil-card__identity h2 {
  margin: 0;
  font-size: 2.4rem;
}

.perfil-card__identity p {
  margin: 0.4rem 0 0.7rem;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.86);
}

.perfil-card__badge {
  display: inline-flex;
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}

.perfil-card__button {
  align-self: center;
  min-width: 160px;
  height: 3.2rem;
  border: none;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-weight: 700;
}

.perfil-section {
  padding: 2rem;
  border-top: 1px solid var(--color-border);
}

.perfil-section h3 {
  margin: 0 0 1.4rem;
  font-size: 2rem;
}

.perfil-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}

.perfil-info {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1.2rem 1rem;
  border-radius: 1rem;
  border: 1px solid var(--color-border);
  background: #fafafa;
}

.perfil-info--full {
  grid-column: 1 / -1;
}

.perfil-info span {
  color: var(--color-text-muted);
}

.perfil-info small,
.perfil-info strong {
  display: block;
}

.perfil-info small {
  margin-bottom: 0.25rem;
  color: var(--color-text-muted);
}

.perfil-security {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  height: 3.2rem;
  padding: 0 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: #fff;
  font-weight: 700;
}

.feedback {
  width: min(100%, 720px);
  margin: 0 auto;
  padding: 1rem;
  border-radius: 1rem;
  text-align: center;
  background: #fff;
  border: 1px solid var(--color-border);
}

.feedback--error {
  color: #b42318;
}

@media (max-width: 900px) {
  .perfil-card__top,
  .perfil-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .perfil-card__avatar {
    width: 84px;
    height: 84px;
    font-size: 2.2rem;
  }
}
</style>
