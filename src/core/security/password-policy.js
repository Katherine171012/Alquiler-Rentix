import { PASSWORD_POLICY } from './auth-security.config.js'

export function validatePassword(password) {
  const errors = []
  const policy = PASSWORD_POLICY

  if (!password || password.length < policy.minLength) {
    errors.push(`Mínimo ${policy.minLength} caracteres.`)
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Debe incluir al menos una mayúscula.')
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Debe incluir al menos una minúscula.')
  }

  if (policy.requireDigit && !/\d/.test(password)) {
    errors.push('Debe incluir al menos un número.')
  }

  if (policy.requireSpecial) {
    const specialPattern = new RegExp(
      `[${policy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`,
    )
    if (!specialPattern.test(password)) {
      errors.push('Debe incluir al menos un carácter especial (!@#$…).')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    rules: getPasswordRulesStatus(password),
  }
}

export function getPasswordRulesStatus(password = '') {
  const policy = PASSWORD_POLICY
  const specialPattern = new RegExp(
    `[${policy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`,
  )

  return [
    { id: 'length', label: `Al menos ${policy.minLength} caracteres`, met: password.length >= policy.minLength },
    { id: 'upper', label: 'Una letra mayúscula', met: /[A-Z]/.test(password) },
    { id: 'lower', label: 'Una letra minúscula', met: /[a-z]/.test(password) },
    { id: 'digit', label: 'Un número', met: /\d/.test(password) },
    { id: 'special', label: 'Un carácter especial', met: specialPattern.test(password) },
  ]
}
