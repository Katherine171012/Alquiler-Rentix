import api from './axios'

export function listarCategoriasVehiculo(params) {
  return api.get('/categorias-vehiculo', { params })
}

export function obtenerCategoriaVehiculo(idCategoria) {
  return api.get(`/categorias-vehiculo/${idCategoria}`)
}

export function crearCategoriaVehiculo(payload) {
  return api.post('/categorias-vehiculo', payload)
}

export function actualizarCategoriaVehiculo(idCategoria, payload) {
  return api.put(`/categorias-vehiculo/${idCategoria}`, payload)
}

export function inactivarCategoriaVehiculo(idCategoria) {
  return api.post(`/categorias-vehiculo/${idCategoria}/inactivar`)
}
