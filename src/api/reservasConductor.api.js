import api from './axios'

export function listarConductoresReserva(idReserva) {
  return api.get('/reservas-conductores', {
    params: { idReserva },
  })
}

export function asignarConductorReserva(payload) {
  return api.post('/reservas-conductores/asignar', payload)
}
