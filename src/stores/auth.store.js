import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loginRequest } from '../modules/auth/services/auth.service'
import { normalizeRole, normalizeRoles } from '../core/constants/roles'
import { mapLoginSecurityState } from '../core/security/login-security.mapper'
import { requiresMfa, validateMfaCode } from '../core/security/auth-security.service'

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

function buildLoginPayload(credentials, security = {}) {
  const payload = {
    username: credentials?.username ?? '',
    password: credentials?.password ?? '',
  }

  if (security.captchaToken) {
    payload.captchaToken = security.captchaToken
  }
  if (security.captchaAnswer != null && security.captchaAnswer !== '') {
    payload.captchaAnswer = security.captchaAnswer
  }

  return payload
}

function mapLoginError(error) {
  const status = error?.status ?? 0
  const security = mapLoginSecurityState(error?.data, status)

  return {
    success: false,
    message: error?.message || 'No se pudo iniciar sesión.',
    errors: Array.isArray(error?.errors) ? error.errors : [],
    status,
    data: error?.data ?? null,
    security: security ? { ...security, message: error?.message } : null,
  }
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

  async function login(credentials, security = {}) {
    let response

    try {
      response = await loginRequest(buildLoginPayload(credentials, security))
    } catch (error) {
      return mapLoginError(error)
    }

    if (!response.success) {
      const status = response.status ?? 401
      const mapped = mapLoginSecurityState(response.data, status)
      return {
        ...response,
        status,
        security: mapped ? { ...mapped, message: response.message } : null,
      }
    }

    if (requiresMfa() && !security.mfaVerified) {
      if (!validateMfaCode(security.mfaCode)) {
        return {
          success: false,
          message: security.mfaCode
            ? 'Código MFA inválido. Debe tener 6 dígitos.'
            : 'Completa la verificación MFA para continuar.',
          errors: [],
          security: { requiresMfa: true },
        }
      }
    }

    const backendUser = response.data ?? {}
    setSession({
      token: backendUser.token,
      user: {
        idUsuario: backendUser.idUsuario,
        idCliente: backendUser.idCliente ?? null,
        username: backendUser.username,
        correo: backendUser.correo,
        activo: backendUser.activo,
      },
      roles: backendUser.roles ?? [],
      expirationUtc: backendUser.expirationUtc ?? null,
    })

    return { ...response, security: { cleared: true } }
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
