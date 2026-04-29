import { useAuthStore } from '../../stores/auth.store'
import { ADMIN_ROLES } from '../constants/roles'

export function applyAuthGuards(router) {
  router.beforeEach((to) => {
    const authStore = useAuthStore()
    authStore.ensureValidSession()

    const requiresAuth = Boolean(to.meta?.requiresAuth)
    const requiresGuest = Boolean(to.meta?.requiresGuest)
    const allowedRoles = to.meta?.roles ?? []

    if (requiresGuest && authStore.isAuthenticated) {
      return authStore.hasAnyRole(ADMIN_ROLES) ? '/panel' : '/mi-cuenta/reservas'
    }

    if (requiresAuth && !authStore.isAuthenticated) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      }
    }

    if (requiresAuth && allowedRoles.length && !authStore.hasAnyRole(allowedRoles)) {
      return '/403'
    }

    return true
  })
}
