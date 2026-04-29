import api from './axios'

export function listarFacturas(params) {
  return api.get('/facturas', { params })
}

export function consultarFacturas(params) {
  return api.get('/facturas/consulta', { params })
}

export function obtenerFactura(idFactura) {
  return api.get(`/facturas/${idFactura}`)
}

export function generarFactura(payload) {
  return api.post('/facturas/generar', payload)
}

export function anularFactura(idFactura) {
  return api.post(`/facturas/${idFactura}/anular`)
}

export function listarFacturasCliente(idCliente) {
  return api.get(`/facturas/cliente/${idCliente}`)
}

export function obtenerFacturaPorReserva(idReserva) {
  return api.get(`/facturas/reserva/${idReserva}`)
}

export function descargarImpresionFactura(idFactura) {
  return api.get(`/facturas/${idFactura}/impresion`, {
    responseType: 'blob',
  })
}
