import api from './axios'
import internoApi from './axiosInterno'

function calcularDiasAlquiler(fechaInicioUtc, fechaFinUtc) {
  const inicio = new Date(fechaInicioUtc)
  const fin = new Date(fechaFinUtc)
  const diff = fin.getTime() - inicio.getTime()
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)))
}

function normalizarVehiculosDisponibles(items, payload) {
  const dias = calcularDiasAlquiler(payload.fechaInicioUtc, payload.fechaFinUtc)
  return items.map((item) => {
    const vehiculo = item?.vehiculo ?? item
    const precio = Number(vehiculo?.precioBaseDia ?? 0)
    return {
      vehiculo,
      diasAlquiler: dias,
      precioPorDiaCongelado: precio,
      subtotalEstimadoVehiculo: precio * dias,
    }
  })
}

async function consultarDisponibilidadFallback(payload) {
  const response = await internoApi.get('/vehiculos/consulta', {
    params: {
      localizacionActual: payload.idLocalizacion,
      idCategoria: payload.idCategoriaVehiculo || undefined,
      soloActivos: true,
      inactivosAlFinal: true,
      pageNumber: 1,
      pageSize: 200,
    },
  })

  const items = response?.data?.items ?? []
  return {
    success: true,
    message: response?.message ?? 'Operación exitosa',
    data: normalizarVehiculosDisponibles(items, payload),
    errors: [],
  }
}

export function listarReservas(params) {
  return api.get('/reservas', { params })
}

export async function consultarDisponibilidadVehiculos(payload) {
  // MS Reservas V1 no tiene commerce/disponibilidad; usar catálogo interno vía middleware.
  return consultarDisponibilidadFallback(payload)
}

export function consultarReservas(params) {
  return api.get('/reservas/consulta', { params })
}

export function obtenerReserva(idReserva) {
  return api.get(`/reservas/${idReserva}`)
}

export function crearReserva(payload) {
  return api.post('/reservas', payload)
}

export function actualizarReserva(idReserva, payload) {
  return api.put(`/reservas/${idReserva}`, payload)
}

export function confirmarReserva(idReserva) {
  return api.post(`/reservas/${idReserva}/confirmar`)
}

export function cancelarReserva(idReserva) {
  return api.post(`/reservas/${idReserva}/cancelar`)
}

export function iniciarReserva(idReserva) {
  return api.post(`/reservas/${idReserva}/iniciar`)
}

export function finalizarReserva(idReserva) {
  return api.post(`/reservas/${idReserva}/finalizar`)
}
