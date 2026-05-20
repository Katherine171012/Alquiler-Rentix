/** Política de seguridad de autenticación (simulada en frontend para demo/presentación). */
export const AUTH_SECURITY_POLICY = {
  maxFailedAttempts: 5,
  lockoutMinutes: 15,
  captchaAfterAttempts: 3,
  rateLimitWindowMs: 60_000,
  maxAttemptsPerIp: 60,
  maxAttemptsPerUser: 30,
  mfaDemoCode: '123456',
  progressiveDelayBaseMs: 800,
  progressiveDelayMaxMs: 8_000,
}

export const PASSWORD_POLICY = {
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
}
