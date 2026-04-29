import api from './axios'

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

export function buscarUsuarios(payload) {
  return api.post('/usuarios/buscar', payload)
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
