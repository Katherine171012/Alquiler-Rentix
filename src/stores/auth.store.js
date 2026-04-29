import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loginRequest } from '../modules/auth/services/auth.service'
import { normalizeRole, normalizeRoles } from '../core/constants/roles'

const AUTH_STORAGE_KEY = 'rentixautos.auth.session'

function parseSession(rawValue) {
  if (!rawValue) return null

  try {
    const parsed = JSON.parse(rawValue)
    return {
      token: parsed?.token ?? '',
      user: parsed?.user ?? null,
      roles: normalizeRoles(parsed?.roles),
      expirationUtc: parsed?.expirationUtc ?? null,
    }
  } catch {
    return null
  }
}

function isExpired(expirationUtc) {
  if (!expirationUtc) return false
  const expiresAt = Date.parse(expirationUtc)
  if (Number.isNaN(expiresAt)) return false
  return Date.now() >= expiresAt
}

export const useAuthStore = defineStore('auth', () => {
  const persistedSession = parseSession(localStorage.getItem(AUTH_STORAGE_KEY))

  const token = ref(persistedSession?.token ?? '')
  const user = ref(persistedSession?.user ?? null)
  const roles = ref(persistedSession?.roles ?? [])
  const expirationUtc = ref(persistedSession?.expirationUtc ?? null)

  const isAuthenticated = computed(() => Boolean(token.value) && !isExpired(expirationUtc.value))

  function persistSession() {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: token.value,
        user: user.value,
        roles: roles.value,
        expirationUtc: expirationUtc.value,
      }),
    )
  }

  function setSession(payload) {
    token.value = payload?.token ?? ''
    user.value = payload?.user ?? null
    roles.value = normalizeRoles(payload?.roles)
    expirationUtc.value = payload?.expirationUtc ?? null

    if (token.value) {
      persistSession()
      return
    }

    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  function logout() {
    token.value = ''
    user.value = null
    roles.value = []
    expirationUtc.value = null
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  async function login(credentials) {
    const response = await loginRequest(credentials)

    if (!response.success) {
      return response
    }

    const backendUser = response.data ?? {}
    setSession({
      token: backendUser.token,
      user: {
        idUsuario: backendUser.idUsuario,
        username: backendUser.username,
        correo: backendUser.correo,
        activo: backendUser.activo,
      },
      roles: backendUser.roles ?? [],
      expirationUtc: backendUser.expirationUtc ?? null,
    })

    return response
  }

  function ensureValidSession() {
    if (!token.value) return

    if (isExpired(expirationUtc.value)) {
      logout()
    }
  }

  ensureValidSession()

  function clearSession() {
    logout()
  }

  function hasRole(role) {
    const normalizedRole = normalizeRole(role)
    return Boolean(normalizedRole) && roles.value.includes(normalizedRole)
  }

  function hasAnyRole(allowedRoles = []) {
    if (!allowedRoles.length) return true

    const normalizedAllowedRoles = normalizeRoles(allowedRoles)
    return normalizedAllowedRoles.some((role) => roles.value.includes(role))
  }

  return {
    token,
    user,
    roles,
    expirationUtc,
    isAuthenticated,
    login,
    logout,
    ensureValidSession,
    setSession,
    clearSession,
    hasRole,
    hasAnyRole,
  }
})
