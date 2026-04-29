import api from './axios'

export function listarReservas(params) {
  return api.get('/reservas', { params })
}

export function consultarDisponibilidadVehiculos(payload) {
  return api.post('/reservas/commerce/disponibilidad-vehiculos', payload)
}

export function consultarReservas(params) {
  return api.get('/reservas/consulta', { params })
}

export function obtenerReserva(idReserva) {
  return api.get(`/reservas/${idReserva}`)
}

export function crearReserva(payload) {
  return api.post('/reservas', payload)
}

export function actualizarReserva(idReserva, payload) {
  return api.put(`/reservas/${idReserva}`, payload)
}

export function confirmarReserva(idReserva) {
  return api.post(`/reservas/${idReserva}/confirmar`)
}

export function cancelarReserva(idReserva) {
  return api.post(`/reservas/${idReserva}/cancelar`)
}

export function iniciarReserva(idReserva) {
  return api.post(`/reservas/${idReserva}/iniciar`)
}

export function finalizarReserva(idReserva) {
  return api.post(`/reservas/${idReserva}/finalizar`)
}
