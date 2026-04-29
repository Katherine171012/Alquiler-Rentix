import api from './axios'

export function listarLocalizaciones(params) {
  return api.get('/localizaciones', { params })
}

export function consultarLocalizaciones(params) {
  return api.get('/localizaciones/consulta', { params })
}

export function obtenerLocalizacion(idLocalizacion) {
  return api.get(`/localizaciones/${idLocalizacion}`)
}

export function crearLocalizacion(payload) {
  return api.post('/localizaciones', payload)
}

export function actualizarLocalizacion(idLocalizacion, payload) {
  return api.put(`/localizaciones/${idLocalizacion}`, payload)
}

export function inactivarLocalizacion(idLocalizacion) {
  return api.post(`/localizaciones/${idLocalizacion}/inactivar`)
}
