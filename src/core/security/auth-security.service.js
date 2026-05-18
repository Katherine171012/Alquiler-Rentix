import { AUTH_SECURITY_POLICY } from './auth-security.config.js'
import { logSecurityEvent } from './security-logger.js'

const STATE_KEY = 'rentixautos.auth.security.state'
const CLIENT_ID_KEY = 'rentixautos.client.id'

function now() {
  return Date.now()
}

function normalizeKey(value = '') {
  return String(value).trim().toLowerCase()
}

function readState() {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    return raw ? JSON.parse(raw) : { users: {}, ips: {}, captchas: {} }
  } catch {
    return { users: {}, ips: {}, captchas: {} }
  }
}

function writeState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state))
}

export function getClientIp() {
  let clientId = localStorage.getItem(CLIENT_ID_KEY)
  if (!clientId) {
    clientId = `ip-sim-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(CLIENT_ID_KEY, clientId)
  }
  return clientId
}

function getUserState(state, username) {
  const key = normalizeKey(username)
  if (!state.users[key]) {
    state.users[key] = { failedAttempts: 0, lockedUntil: 0, lastAttemptAt: 0 }
  }
  return state.users[key]
}

function getIpState(state, ip) {
  const key = normalizeKey(ip)
  if (!state.ips[key]) {
    state.ips[key] = { attempts: [], lockedUntil: 0 }
  }
  return state.ips[key]
}

function pruneAttempts(attempts, windowMs) {
  const cutoff = now() - windowMs
  return attempts.filter((ts) => ts > cutoff)
}

function formatLockoutRemaining(lockedUntil) {
  const minutes = Math.ceil((lockedUntil - now()) / 60_000)
  return minutes <= 1 ? '1 minuto' : `${minutes} minutos`
}

export function getProgressiveDelayMs(failedAttempts) {
  if (failedAttempts <= 1) return 0
  const base = AUTH_SECURITY_POLICY.progressiveDelayBaseMs
  const max = AUTH_SECURITY_POLICY.progressiveDelayMaxMs
  return Math.min(max, base * 2 ** (failedAttempts - 2))
}

export function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function createCaptchaChallenge() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  const token = crypto.randomUUID?.() ?? `cap-${now()}`
  const answer = String(a + b)

  const state = readState()
  state.captchas[token] = { answer, expiresAt: now() + 10 * 60_000 }
  writeState(state)

  return {
    token,
    question: `${a} + ${b}`,
    label: 'Verificación de seguridad (captcha)',
  }
}

export function validateCaptcha(token, userAnswer) {
  const state = readState()
  const challenge = state.captchas[token]
  delete state.captchas[token]
  writeState(state)

  if (!challenge || challenge.expiresAt < now()) {
    return false
  }

  return String(userAnswer).trim() === challenge.answer
}

export function requiresCaptcha(username) {
  const state = readState()
  const user = getUserState(state, username)
  return user.failedAttempts >= AUTH_SECURITY_POLICY.captchaAfterAttempts
}

export function requiresMfa() {
  return true
}

export function validateMfaCode(code) {
  const normalized = String(code ?? '').trim()
  return normalized.length === 6 && /^\d{6}$/.test(normalized)
}

export function evaluatePreLogin(username, ip = getClientIp()) {
  const state = readState()
  const user = getUserState(state, username)
  const ipState = getIpState(state, ip)
  const policy = AUTH_SECURITY_POLICY

  if (user.lockedUntil > now()) {
    logSecurityEvent({
      level: 'warn',
      type: 'ACCOUNT_LOCKED',
      username: normalizeKey(username),
      ip,
      message: 'Intento de login con cuenta bloqueada temporalmente',
    })
    return {
      allowed: false,
      message: `Cuenta bloqueada temporalmente. Intenta en ${formatLockoutRemaining(user.lockedUntil)}.`,
      locked: true,
      requiresCaptcha: true,
      suspicious: true,
      failedAttempts: user.failedAttempts,
      lockoutRemainingMs: user.lockedUntil - now(),
    }
  }

  ipState.attempts = pruneAttempts(ipState.attempts, policy.rateLimitWindowMs)
  if (ipState.attempts.length >= policy.maxAttemptsPerIp) {
    logSecurityEvent({
      level: 'warn',
      type: 'RATE_LIMIT_IP',
      username: normalizeKey(username),
      ip,
      message: 'Rate limit por IP excedido',
    })
    return {
      allowed: false,
      message: 'Demasiados intentos desde esta red. Espera un momento e intenta de nuevo.',
      rateLimited: true,
      requiresCaptcha: user.failedAttempts >= policy.captchaAfterAttempts,
      suspicious: true,
      failedAttempts: user.failedAttempts,
    }
  }

  const userAttemptsInWindow = user.recentAttempts
    ? pruneAttempts(user.recentAttempts, policy.rateLimitWindowMs).length
    : 0

  if (userAttemptsInWindow >= policy.maxAttemptsPerUser) {
    logSecurityEvent({
      level: 'warn',
      type: 'RATE_LIMIT_USER',
      username: normalizeKey(username),
      ip,
      message: 'Rate limit por usuario excedido',
    })
    return {
      allowed: false,
      message: 'Demasiados intentos para este usuario. Espera un momento.',
      rateLimited: true,
      requiresCaptcha: user.failedAttempts >= policy.captchaAfterAttempts,
      suspicious: true,
      failedAttempts: user.failedAttempts,
    }
  }

  return {
    allowed: true,
    message: '',
    requiresCaptcha: user.failedAttempts >= policy.captchaAfterAttempts,
    suspicious: user.failedAttempts >= 2,
    failedAttempts: user.failedAttempts,
    progressiveDelayMs: getProgressiveDelayMs(user.failedAttempts),
  }
}

export function recordFailedAttempt(username, ip = getClientIp()) {
  const state = readState()
  const user = getUserState(state, username)
  const ipState = getIpState(state, ip)
  const policy = AUTH_SECURITY_POLICY
  const ts = now()

  user.failedAttempts += 1
  user.lastAttemptAt = ts
  user.recentAttempts = pruneAttempts([...(user.recentAttempts ?? []), ts], policy.rateLimitWindowMs)
  ipState.attempts = pruneAttempts([...ipState.attempts, ts], policy.rateLimitWindowMs)

  const requiresCaptchaNow = user.failedAttempts >= policy.captchaAfterAttempts
  let locked = false
  let message = `Credenciales incorrectas. Intento ${user.failedAttempts} de ${policy.maxFailedAttempts}.`

  if (user.failedAttempts >= policy.maxFailedAttempts) {
    user.lockedUntil = ts + policy.lockoutMinutes * 60_000
    locked = true
    message = `Intento ${user.failedAttempts} de ${policy.maxFailedAttempts}. Cuenta bloqueada ${policy.lockoutMinutes} minutos.`
  } else if (requiresCaptchaNow) {
    message += ' Debes completar el captcha para continuar.'
  }

  logSecurityEvent({
    level: locked ? 'error' : 'warn',
    type: locked ? 'ACCOUNT_LOCKOUT' : 'LOGIN_FAILED',
    username: normalizeKey(username),
    ip,
    failedAttempts: user.failedAttempts,
    message,
  })

  writeState(state)

  return {
    failedAttempts: user.failedAttempts,
    requiresCaptcha: requiresCaptchaNow,
    locked,
    suspicious: user.failedAttempts >= 2,
    message,
    progressiveDelayMs: getProgressiveDelayMs(user.failedAttempts),
    lockoutRemainingMs: locked ? user.lockedUntil - ts : 0,
  }
}

export function recordSuccessfulLogin(username, ip = getClientIp()) {
  const state = readState()
  const key = normalizeKey(username)
  if (state.users[key]) {
    state.users[key] = {
      failedAttempts: 0,
      lockedUntil: 0,
      lastAttemptAt: now(),
      recentAttempts: [],
    }
  }
  writeState(state)

  logSecurityEvent({
    level: 'info',
    type: 'LOGIN_SUCCESS',
    username: key,
    ip,
    message: 'Inicio de sesión exitoso tras validaciones de seguridad',
  })
}

export function getAttemptDisplay(failedAttempts = 0) {
  const policy = AUTH_SECURITY_POLICY
  const current = Math.min(failedAttempts, policy.maxFailedAttempts)
  const remaining = Math.max(0, policy.maxFailedAttempts - current)
  const captchaIn = Math.max(0, policy.captchaAfterAttempts - current)

  return {
    failedAttempts: current,
    maxFailedAttempts: policy.maxFailedAttempts,
    label: current > 0 ? `Intento ${current} de ${policy.maxFailedAttempts}` : `Sin intentos fallidos (máx. ${policy.maxFailedAttempts})`,
    remainingLabel:
      remaining > 0
        ? `Quedan ${remaining} intento${remaining === 1 ? '' : 's'} antes del bloqueo`
        : 'Sin intentos restantes',
    captchaHint:
      current >= policy.captchaAfterAttempts
        ? 'Captcha obligatorio'
        : captchaIn > 0
          ? `Captcha en el intento ${policy.captchaAfterAttempts}`
          : '',
    progressPercent: Math.round((current / policy.maxFailedAttempts) * 100),
    steps: Array.from({ length: policy.maxFailedAttempts }, (_, index) => {
      const step = index + 1
      return {
        step,
        failed: step <= current,
        captcha: step === policy.captchaAfterAttempts,
        lock: step === policy.maxFailedAttempts,
      }
    }),
  }
}

export function getSecurityStatus(username) {
  const state = readState()
  const user = getUserState(state, username)
  const policy = AUTH_SECURITY_POLICY

  const locked = user.lockedUntil > now()

  return {
    failedAttempts: user.failedAttempts,
    maxFailedAttempts: policy.maxFailedAttempts,
    requiresCaptcha: user.failedAttempts >= policy.captchaAfterAttempts,
    locked,
    lockoutRemainingMs: Math.max(0, user.lockedUntil - now()),
    suspicious: user.failedAttempts >= 2,
    message: locked
      ? `Cuenta bloqueada temporalmente. Intenta en ${formatLockoutRemaining(user.lockedUntil)}.`
      : '',
  }
}
