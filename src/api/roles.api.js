import api from './axios'

export function listarRoles(params) {
  return api.get('/roles', { params })
}

export function obtenerRol(idRol) {
  return api.get(`/roles/${idRol}`)
}

export function crearRol(payload) {
  return api.post('/roles', payload)
}

export function actualizarRol(idRol, payload) {
  return api.put(`/roles/${idRol}`, payload)
}

export function inactivarRol(idRol) {
  return api.post(`/roles/${idRol}/inactivar`)
}
