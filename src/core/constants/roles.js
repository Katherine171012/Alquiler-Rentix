export const ROLES = Object.freeze({
  CLIENTE: 'CLIENTE',
  ADMIN: 'ADMINISTRADOR',
  VENDEDOR: 'VENDEDOR',
})

export const ADMIN_ROLES = Object.freeze([ROLES.ADMIN, ROLES.VENDEDOR])

const ROLE_ALIASES = Object.freeze({
  CLIENTE: ROLES.CLIENTE,
  CUSTOMER: ROLES.CLIENTE,
  USUARIO: ROLES.CLIENTE,
  ADMIN: ROLES.ADMIN,
  ADMINISTRADOR: ROLES.ADMIN,
  VENDEDOR: ROLES.VENDEDOR,
  SELLER: ROLES.VENDEDOR,
})

export function normalizeRole(role) {
  if (!role || typeof role !== 'string') return ''
  const key = role.trim().toUpperCase()
  return ROLE_ALIASES[key] ?? key
}

export function normalizeRoles(roles = []) {
  if (!Array.isArray(roles)) return []
  return [...new Set(roles.map(normalizeRole).filter(Boolean))]
}
