import { ROLES } from '../core/constants/roles'

export function esAdministrador(authStore) {
  return authStore?.hasRole?.(ROLES.ADMIN) ?? false
}

export function esVendedor(authStore) {
  return authStore?.hasRole?.(ROLES.VENDEDOR) ?? false
}

export function esCliente(authStore) {
  return authStore?.hasRole?.(ROLES.CLIENTE) ?? false
}
