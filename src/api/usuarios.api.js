import api from './axiosInterno'

export function listarUsuarios(params) {
  return api.get('/usuarios', { params })
}

export function obtenerUsuario(idUsuario) {
  return api.get(`/usuarios/${idUsuario}`)
}

export function crearUsuario(payload) {
  return api.post('/usuarios', payload)
}

export function actualizarUsuario(idUsuario, payload) {
  return api.put(`/usuarios/${idUsuario}`, payload)
}

/** El MS Seguridad no tiene POST buscar; se usa listado GET. */
export function buscarUsuarios(params) {
  return listarUsuarios(params)
}

export function inactivarUsuario(idUsuario) {
  return api.post(`/usuarios/${idUsuario}/inactivar`)
}

export function activarUsuario(idUsuario) {
  return api.post(`/usuarios/${idUsuario}/activar`)
}

export function cambiarClaveUsuario(idUsuario, payload) {
  return api.post(`/usuarios/${idUsuario}/cambiar-clave`, payload)
}
