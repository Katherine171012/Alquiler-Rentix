import api from './axiosInterno'

export function listarAuditorias(params) {
  return api.get('/auditorias', { params })
}

export function obtenerAuditoria(idAuditoria) {
  return api.get(`/auditorias/${idAuditoria}`)
}

export function buscarAuditorias(payload) {
  return api.post('/auditorias/buscar', payload)
}
