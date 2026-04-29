import api from './axios'

export function listarExtras(params) {
  return api.get('/extras', { params })
}

export function obtenerExtra(idExtra) {
  return api.get(`/extras/${idExtra}`)
}

export function crearExtra(payload) {
  return api.post('/extras', payload)
}

export function actualizarExtra(idExtra, payload) {
  return api.put(`/extras/${idExtra}`, payload)
}

export function inactivarExtra(idExtra) {
  return api.post(`/extras/${idExtra}/inactivar`)
}
