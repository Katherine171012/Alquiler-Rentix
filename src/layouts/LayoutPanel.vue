<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BookText,
  Boxes,
  CalendarDays,
  CarFront,
  CircleUserRound,
  Gauge,
  LogOut,
  MapPin,
  Menu,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRoundCog,
  Users,
  X,
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.store'
import { ROLES } from '../core/constants/roles'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isSidebarOpen = ref(false)

const baseItems = [
  { label: 'Resumen', to: '/panel', icon: Gauge },
  { label: 'Reservas', to: '/panel/reservas', icon: CalendarDays },
  { label: 'Clientes', to: '/panel/clientes', icon: Users },
  { label: 'Vehículos', to: '/panel/vehiculos', icon: CarFront },
  { label: 'Facturas', to: '/panel/facturas', icon: ReceiptText },
  { label: 'Conductores', to: '/panel/conductores', icon: CircleUserRound },
  { label: 'Extras', to: '/panel/extras', icon: Boxes },
]

const adminOnlyItems = [
  { label: 'Configuración', to: '/panel/configuracion', icon: Settings },
  { label: 'Usuarios', to: '/panel/usuarios', icon: UserRoundCog },
  { label: 'Auditoría', to: '/panel/auditoria', icon: ShieldCheck },
]

const menuItems = computed(() => {
  const items = [...baseItems]
  if (authStore.hasRole(ROLES.ADMIN)) items.push(...adminOnlyItems)
  return items
})

watch(
  () => route.fullPath,
  () => {
    isSidebarOpen.value = false
  },
)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

const currentUser = computed(() => authStore.user ?? {})
const currentRole = computed(() => authStore.roles[0] ?? 'USUARIO')
const userInitial = computed(() => String(currentUser.value?.username ?? 'A').slice(0, 1).toUpperCase())

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="panel-layout">
    <button type="button" class="panel-layout__menu-toggle" @click="toggleSidebar">
      <Menu :size="18" />
      <span>Menú</span>
    </button>

    <button
      v-if="isSidebarOpen"
      type="button"
      class="panel-layout__backdrop"
      aria-label="Cerrar menú"
      @click="toggleSidebar"
    />

    <aside class="panel-layout__sidebar" :class="{ 'panel-layout__sidebar--open': isSidebarOpen }">
      <div class="panel-layout__brand">
        <div class="panel-layout__brand-icon">
          <CarFront :size="18" />
        </div>
        <div>
          <h2>Rentix Autos</h2>
          <p>Sistema de gestión</p>
        </div>
      </div>

      <button type="button" class="panel-layout__close" @click="toggleSidebar">
        <X :size="18" />
      </button>

      <RouterLink to="/" class="panel-layout__site-link">
        <MapPin :size="18" />
        <span>Ir al Sitio</span>
      </RouterLink>

      <nav class="panel-layout__menu">
        <RouterLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="panel-layout__item"
          :class="{ 'panel-layout__item--active': route.path === item.to }"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="panel-layout__footer">
        <div class="panel-layout__account">
          <div class="panel-layout__avatar">{{ userInitial }}</div>
          <div>
            <strong>{{ currentUser.username || 'Administrador' }}</strong>
            <small>{{ currentRole }}</small>
          </div>
        </div>

        <button type="button" class="panel-layout__logout" @click="logout">
          <LogOut :size="18" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <main class="panel-layout__content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.panel-layout {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 284px minmax(0, 1fr);
  background: var(--color-bg);
}

.panel-layout__sidebar {
  position: sticky;
  top: 0;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  gap: 1.25rem;
  background: linear-gradient(180deg, #65122f, #520e27);
  color: #fff;
  padding: 1.4rem 1rem;
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.08);
}

.panel-layout__brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.panel-layout__brand h2,
.panel-layout__brand p {
  margin: 0;
}

.panel-layout__brand h2 {
  font-size: 1.95rem;
  line-height: 1;
}

.panel-layout__brand p {
  margin-top: 0.3rem;
  color: rgba(255, 255, 255, 0.7);
}

.panel-layout__brand-icon,
.panel-layout__avatar {
  display: grid;
  height: 2.75rem;
  width: 2.75rem;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.panel-layout__site-link,
.panel-layout__item,
.panel-layout__logout {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  border-radius: 1rem;
  color: #fff;
  text-decoration: none;
}

.panel-layout__menu {
  display: grid;
  gap: 0.35rem;
}

.panel-layout__site-link,
.panel-layout__item {
  padding: 0.9rem 1rem;
  opacity: 0.92;
  transition:
    transform 0.16s ease,
    background 0.16s ease,
    opacity 0.16s ease;
}

.panel-layout__item--active {
  background: rgba(190, 36, 91, 0.58);
  font-weight: 700;
  opacity: 1;
}

.panel-layout__item:hover,
.panel-layout__site-link:hover {
  transform: translateX(2px);
  background: rgba(255, 255, 255, 0.08);
  opacity: 1;
}

.panel-layout__content {
  min-width: 0;
  padding: 2rem;
}

.panel-layout__footer {
  margin-top: auto;
  display: grid;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-layout__account {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.8rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.06);
}

.panel-layout__account strong,
.panel-layout__account small {
  display: block;
}

.panel-layout__account small {
  margin-top: 0.2rem;
  color: rgba(255, 255, 255, 0.72);
}

.panel-layout__logout {
  justify-content: center;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 0.5rem;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.panel-layout__menu-toggle {
  display: none;
}

.panel-layout__close,
.panel-layout__backdrop {
  display: none;
}

@media (max-width: 1024px) {
  .panel-layout {
    grid-template-columns: 1fr;
  }

  .panel-layout__menu-toggle {
    display: inline-flex;
    position: fixed;
    top: 0.8rem;
    left: 0.8rem;
    z-index: 20;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid #d0d5dd;
    background: #fff;
    border-radius: 999px;
    padding: 0.55rem 0.8rem;
    box-shadow: var(--shadow-sm);
  }

  .panel-layout__sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(82vw, 290px);
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    z-index: 15;
  }

  .panel-layout__sidebar--open {
    transform: translateX(0);
  }

  .panel-layout__close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: inline-flex;
    border: 0;
    background: transparent;
    color: #fff;
    cursor: pointer;
  }

  .panel-layout__backdrop {
    position: fixed;
    inset: 0;
    z-index: 10;
    display: block;
    border: 0;
    background: rgba(17, 24, 39, 0.35);
  }

  .panel-layout__content {
    padding: 4.5rem 1rem 1.25rem;
  }
}
</style>
