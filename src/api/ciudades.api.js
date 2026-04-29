import api from './axios'

export function listarCiudades(params) {
  return api.get('/ciudades', { params })
}

export function consultarCiudades(payload) {
  return api.post('/ciudades/buscar', payload)
}

export function listarCiudadesPorPais(idPais, params) {
  return api.get(`/ciudades/pais/${idPais}`, { params })
}

export function obtenerCiudad(idCiudad) {
  return api.get(`/ciudades/${idCiudad}`)
}

export function crearCiudad(payload) {
  return api.post('/ciudades', payload)
}

export function actualizarCiudad(idCiudad, payload) {
  return api.put(`/ciudades/${idCiudad}`, payload)
}

export function inactivarCiudad(idCiudad) {
  return api.post(`/ciudades/${idCiudad}/inactivar`)
}
