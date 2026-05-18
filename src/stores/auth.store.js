import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loginRequest } from '../modules/auth/services/auth.service'
import { normalizeRole, normalizeRoles } from '../core/constants/roles'
import {
  delay,
  evaluatePreLogin,
  getClientIp,
  recordFailedAttempt,
  recordSuccessfulLogin,
  requiresMfa,
  validateCaptcha,
  validateMfaCode,
} from '../core/security/auth-security.service'
import { logSecurityEvent } from '../core/security/security-logger'

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

  async function login(credentials, security = {}) {
    const username = credentials?.username ?? ''
    const clientIp = security.clientIp ?? getClientIp()

    const preCheck = evaluatePreLogin(username, clientIp)
    if (!preCheck.allowed) {
      return {
        success: false,
        message: preCheck.message,
        errors: [],
        security: preCheck,
      }
    }

    if (preCheck.progressiveDelayMs > 0) {
      await delay(preCheck.progressiveDelayMs)
    }

    if (preCheck.requiresCaptcha) {
      const captchaOk = validateCaptcha(security.captchaToken, security.captchaAnswer)
      if (!captchaOk) {
        logSecurityEvent({
          level: 'warn',
          type: 'CAPTCHA_FAILED',
          username,
          ip: clientIp,
          message: 'Captcha incorrecto o expirado',
        })
        return {
          success: false,
          message: 'Captcha incorrecto o expirado. Intenta de nuevo.',
          errors: [],
          security: { ...preCheck, requiresCaptcha: true },
        }
      }
    }

    const response = await loginRequest(credentials)

    if (!response.success) {
      const failState = recordFailedAttempt(username, clientIp)
      return {
        ...response,
        security: failState,
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
          security: { requiresMfa: true, ...preCheck },
        }
      }
    }

    const backendUser = response.data ?? {}
    recordSuccessfulLogin(username, clientIp)
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
