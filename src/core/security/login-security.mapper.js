/**
 * Normaliza LoginSecurityStateDto del backend para la UI de login.
 * @param {object|null|undefined} data
 * @param {number} [httpStatus]
 */
export function mapLoginSecurityState(data, httpStatus = 0) {
  if (!data || typeof data !== 'object') {
    if (httpStatus === 423) {
      return {
        failedAttempts: 5,
        maxFailedAttempts: 5,
        requiresCaptcha: true,
        locked: true,
        lockoutRemainingSeconds: null,
        suspicious: true,
        httpStatus,
      }
    }
    return null
  }

  const lockoutSeconds =
    data.lockoutRemainingSeconds != null ? Number(data.lockoutRemainingSeconds) : null

  return {
    failedAttempts: Number(data.failedAttempts) || 0,
    maxFailedAttempts: Number(data.maxFailedAttempts) || 5,
    requiresCaptcha: Boolean(data.requiresCaptcha),
    locked: Boolean(data.locked) || httpStatus === 423,
    lockoutRemainingSeconds:
      lockoutSeconds != null && !Number.isNaN(lockoutSeconds) ? lockoutSeconds : null,
    suspicious: Boolean(data.suspicious),
    httpStatus,
  }
}

export function formatLockoutCountdown(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  if (seconds <= 0) return ''

  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60

  if (minutes > 0 && remainder > 0) {
    return `${minutes} min ${remainder} s`
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`
  }
  return seconds === 1 ? '1 segundo' : `${seconds} segundos`
}
