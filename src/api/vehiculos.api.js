import api from './axios'

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

export function marcarVehiculoMantenimiento(idVehiculo) {
  return api.post(`/vehiculos/${idVehiculo}/mantenimiento`)
}

export function marcarVehiculoDisponible(idVehiculo) {
  return api.post(`/vehiculos/${idVehiculo}/disponible`)
}
