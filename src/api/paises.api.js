import api from './axios'

export function listarPaises(params) {
  return api.get('/paises', { params })
}

export function obtenerPais(idPais) {
  return api.get(`/paises/${idPais}`)
}

export function crearPais(payload) {
  return api.post('/paises', payload)
}

export function actualizarPais(idPais, payload) {
  return api.put(`/paises/${idPais}`, payload)
}

export function inactivarPais(idPais) {
  return api.post(`/paises/${idPais}/inactivar`)
}
