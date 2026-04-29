import api from './axios'

export function listarExtrasReserva(idReserva) {
  return api.get('/reservas-extras', {
    params: { idReserva },
  })
}

export function agregarExtraReserva(payload) {
  return api.post('/reservas-extras/agregar', payload)
}
