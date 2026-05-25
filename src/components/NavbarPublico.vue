<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { CarFront, LayoutDashboard, UserRound } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.store'
import { ADMIN_ROLES } from '../core/constants/roles'

const route = useRoute()
const authStore = useAuthStore()
const isHome = computed(() => route.path === '/')
const canAccessPanel = computed(() => authStore.hasAnyRole(ADMIN_ROLES))
const accountRoute = computed(() => '/mi-cuenta/perfil')
</script>

<template>
  <header class="navbar">
    <div class="navbar__inner">
      <RouterLink to="/" class="brand">
        <span class="brand__logo"><CarFront :size="12" /></span>
        Rentix Autos
      </RouterLink>
      <nav class="nav-links">
        <RouterLink to="/" :class="{ active: isHome }">Inicio</RouterLink>
        <RouterLink to="/vehiculos" :class="{ active: route.path.startsWith('/vehiculos') }">
          Vehículos
        </RouterLink>
      </nav>
      <div class="actions">
        <template v-if="authStore.isAuthenticated">
          <RouterLink v-if="canAccessPanel" to="/panel" class="ghost ghost--panel">
            <LayoutDashboard :size="14" />
            Volver al Panel
          </RouterLink>
          <RouterLink :to="accountRoute" class="ghost">
            <UserRound :size="14" />
            Mi Cuenta
          </RouterLink>
        </template>
        <template v-else>
          <RouterLink to="/login" class="ghost">Iniciar sesión</RouterLink>
          <RouterLink to="/registro" class="solid">Registrarse</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(12px);
}

.navbar__inner {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  min-height: 72px;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1.5rem;
}

.brand {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 700;
  font-size: 1.08rem;
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  letter-spacing: -0.02em;
  justify-self: start;
}

.brand__logo {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.8rem;
  background: linear-gradient(135deg, #7b173b, #571027);
  color: #fff;
  box-shadow: 0 10px 24px rgba(106, 18, 48, 0.25);
}

.nav-links {
  display: flex;
  gap: 0.45rem;
  align-items: center;
  padding: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  justify-self: center;
}

.nav-links a {
  color: var(--color-text-soft);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.92rem;
  padding: 0.65rem 1.15rem;
  border-radius: 999px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.nav-links a.active {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.actions {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  justify-self: end;
}

.actions a {
  text-decoration: none;
  border-radius: 0.85rem;
  padding: 0.72rem 1.05rem;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  white-space: nowrap;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.actions .ghost {
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-soft);
  background: #fff;
}

.actions .ghost--panel {
  color: var(--color-primary);
  border-color: rgba(123, 23, 59, 0.22);
  background: rgba(123, 23, 59, 0.06);
}

.actions .solid {
  background: linear-gradient(135deg, #7b173b, #571027);
  color: #fff;
  box-shadow: 0 12px 24px rgba(106, 18, 48, 0.2);
}

.actions a:hover,
.nav-links a:hover {
  transform: translateY(-1px);
}

.actions .ghost:hover {
  background: #f9fafb;
}

.actions .solid:hover {
  box-shadow: 0 16px 30px rgba(106, 18, 48, 0.28);
}

@media (max-width: 860px) {
  .navbar__inner {
    grid-template-columns: auto 1fr;
    min-height: 64px;
    padding: 0.75rem 1.25rem;
    gap: 0.75rem;
  }

  .brand {
    grid-column: 1;
  }

  .actions {
    grid-column: 2;
    justify-self: end;
  }

  .nav-links {
    grid-column: 1 / -1;
    justify-self: stretch;
    justify-content: center;
  }
}

@media (max-width: 520px) {
  .navbar__inner {
    padding: 0.6rem 1rem;
    gap: 0.6rem;
  }

  .actions a {
    padding: 0.6rem 0.75rem;
    font-size: 0.82rem;
  }

  .nav-links a {
    padding: 0.55rem 0.85rem;
    font-size: 0.85rem;
  }
}
</style>
