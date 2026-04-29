import api from './axios'

export function listarRolesUsuario(idUsuario) {
  return api.get('/usuarios-roles', {
    params: { idUsuario },
  })
}

export function asignarRolUsuario(payload) {
  return api.post('/usuarios-roles/asignar', payload)
}

export function quitarRolUsuario(idUsuarioRol) {
  return api.post('/usuarios-roles/quitar', null, {
    params: { idUsuarioRol },
  })
}
