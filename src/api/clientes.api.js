import api from './axios'

export function listarClientes(params) {
  return api.get('/clientes', { params })
}

export function consultarClientes(params) {
  return api.get('/clientes/consulta', { params })
}

export function obtenerCliente(idCliente) {
  return api.get(`/clientes/${idCliente}`)
}

export function crearCliente(payload) {
  return api.post('/clientes', payload)
}

export function actualizarCliente(idCliente, payload) {
  return api.put(`/clientes/${idCliente}`, payload)
}

export function inactivarCliente(idCliente) {
  return api.post(`/clientes/${idCliente}/inactivar`)
}
