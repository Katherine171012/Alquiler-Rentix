import api from './axios'

export function listarConductores(params) {
  return api.get('/conductores', { params })
}

export function consultarConductores(params) {
  return api.get('/conductores/consulta', { params })
}

export function obtenerConductor(idConductor) {
  return api.get(`/conductores/${idConductor}`)
}

export function crearConductor(payload) {
  return api.post('/conductores', payload)
}

export function actualizarConductor(idConductor, payload) {
  return api.put(`/conductores/${idConductor}`, payload)
}

export function inactivarConductor(idConductor) {
  return api.post(`/conductores/${idConductor}/inactivar`)
}
