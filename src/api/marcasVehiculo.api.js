import api from './axios'

export function listarMarcasVehiculo(params) {
  return api.get('/marcas-vehiculo', { params })
}

export function obtenerMarcaVehiculo(idMarca) {
  return api.get(`/marcas-vehiculo/${idMarca}`)
}

export function crearMarcaVehiculo(payload) {
  return api.post('/marcas-vehiculo', payload)
}

export function actualizarMarcaVehiculo(idMarca, payload) {
  return api.put(`/marcas-vehiculo/${idMarca}`, payload)
}

export function inactivarMarcaVehiculo(idMarca) {
  return api.post(`/marcas-vehiculo/${idMarca}/inactivar`)
}
