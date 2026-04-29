<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarDays, CarFront, FileText, House, LayoutDashboard, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.store'
import { ADMIN_ROLES } from '../core/constants/roles'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentUserName = computed(() => authStore.user?.username ?? 'Cliente Demo')
const currentRole = computed(() => authStore.roles?.[0] ?? 'CLIENTE')
const canAccessPanel = computed(() => authStore.hasAnyRole(ADMIN_ROLES))

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="cliente-layout">
    <header class="cliente-header">
      <div class="cliente-header__inner">
        <RouterLink to="/" class="cliente-brand">
          <span class="cliente-brand__logo"><CarFront :size="18" /></span>
          <span>RentixAutos</span>
        </RouterLink>

        <nav class="cliente-nav">
          <RouterLink to="/">
            <House :size="18" />
            Inicio
          </RouterLink>
          <RouterLink to="/vehiculos">
            <CarFront :size="18" />
            Vehiculos
          </RouterLink>
          <RouterLink to="/mi-cuenta/reservas" :class="{ active: route.path.includes('/reservas') }">
            <CalendarDays :size="18" />
            Mis Reservas
          </RouterLink>
          <RouterLink to="/mi-cuenta/facturas" :class="{ active: route.path.includes('/facturas') }">
            <FileText :size="18" />
            Mis Facturas
          </RouterLink>
        </nav>

        <div class="cliente-user">
          <RouterLink v-if="canAccessPanel" to="/panel" class="cliente-user__panel">
            <LayoutDashboard :size="18" />
            Volver al Panel
          </RouterLink>
          <RouterLink to="/mi-cuenta/perfil" class="cliente-user__card">
            <span class="cliente-user__avatar">{{ currentUserName.charAt(0).toUpperCase() }}</span>
            <span>
              <strong>{{ currentUserName }}</strong>
              <small>{{ currentRole }}</small>
            </span>
          </RouterLink>
          <button type="button" class="cliente-user__logout" @click="logout">
            <LogOut :size="18" />
          </button>
        </div>
      </div>
    </header>

    <main class="cliente-main">
      <RouterView />
    </main>

    <footer class="cliente-footer">
      <p>© 2026 RentixAutos. Todos los derechos reservados.</p>
    </footer>
  </div>
</template>

<style scoped>
.cliente-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%);
}

.cliente-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(14px);
}

.cliente-header__inner {
  max-width: 1880px;
  margin: 0 auto;
  min-height: 82px;
  padding: 0 1.25rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
}

.cliente-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text);
  text-decoration: none;
  font-size: 1.05rem;
  font-weight: 700;
}

.cliente-brand__logo {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.95rem;
  color: #fff;
  background: linear-gradient(135deg, #7b173b, #571027);
}

.cliente-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.cliente-nav a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  border-radius: 999px;
  text-decoration: none;
  color: var(--color-text);
  font-weight: 600;
}

.cliente-nav a.active,
.cliente-nav a:hover {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.cliente-user {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.cliente-user__panel {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.78rem 1rem;
  border-radius: 999px;
  text-decoration: none;
  color: var(--color-primary);
  background: rgba(123, 23, 59, 0.06);
  border: 1px solid rgba(123, 23, 59, 0.14);
  font-weight: 700;
}

.cliente-user__card {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 190px;
  padding: 0.7rem 0.9rem;
  border-radius: 1rem;
  text-decoration: none;
  background: #fff;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.cliente-user__avatar {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #f2eaf0;
  color: var(--color-primary);
  font-weight: 700;
}

.cliente-user__card strong,
.cliente-user__card small {
  display: block;
}

.cliente-user__card small {
  margin-top: 0.2rem;
  color: var(--color-text-muted);
}

.cliente-user__logout {
  width: 42px;
  height: 42px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.cliente-main {
  flex: 1;
}

.cliente-footer {
  padding: 2rem 1rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
  color: var(--color-text-muted);
}

.cliente-footer p {
  margin: 0;
}

@media (max-width: 1100px) {
  .cliente-header__inner {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .cliente-brand,
  .cliente-user {
    justify-content: center;
  }

  .cliente-user {
    flex-wrap: wrap;
  }
}
</style>
