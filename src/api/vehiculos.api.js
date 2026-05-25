import api from './axiosInterno'

export function listarVehiculos(params) {
  return api.get('/vehiculos', { params })
}

export function consultarVehiculos(params) {
  return api.get('/vehiculos/consulta', { params })
}

export function obtenerVehiculo(idVehiculo) {
  return api.get(`/vehiculos/${idVehiculo}`)
}

export function crearVehiculo(payload) {
  return api.post('/vehiculos', payload)
}

export function actualizarVehiculo(idVehiculo, payload, forzarCambioLocalizacion = false) {
  return api.put(`/vehiculos/${idVehiculo}`, payload, {
    params: { forzarCambioLocalizacion },
  })
}

export function inactivarVehiculo(idVehiculo) {
  return api.post(`/vehiculos/${idVehiculo}/inactivar`)
}

export function activarVehiculo(idVehiculo) {
  return api.post(`/vehiculos/${idVehiculo}/activar`)
}

/** MS Catálogo V1: no hay /mantenimiento; se usa inactivar (estado INA). */
export function marcarVehiculoMantenimiento(idVehiculo) {
  return inactivarVehiculo(idVehiculo)
}

/** MS Catálogo V1: no hay /disponible; se usa activar (estado ACT). */
export function marcarVehiculoDisponible(idVehiculo) {
  return activarVehiculo(idVehiculo)
}
