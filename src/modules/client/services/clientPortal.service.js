import { listarClientes } from '../../../api/clientes.api'
import {
  actualizarReserva,
  cancelarReserva,
  confirmarReserva,
  consultarReservas,
  crearReserva,
  obtenerReserva,
} from '../../../api/reservas.api'
import {
  listarFacturasCliente,
  obtenerFactura,
  obtenerFacturaPorReserva,
} from '../../../api/facturas.api'

function asArray(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

export function getUserDisplayName(user, client) {
  const fullName = [client?.cliNombres, client?.cliApellidos].filter(Boolean).join(' ').trim()
  return (
    fullName ||
    client?.cliRazonSocial ||
    user?.username ||
    user?.correo?.split('@')?.[0] ||
    'Cliente Demo'
  )
}

export function getClientEmail(user, client) {
  return client?.cliCorreoElectronico || user?.correo || ''
}

export async function resolveCurrentClient(user) {
  if (!user?.correo) return null

  const response = await listarClientes()
  const clientes = asArray(response?.data)
  const correo = user.correo.toLowerCase()

  return (
    clientes.find((client) => client?.cliCorreoElectronico?.toLowerCase() === correo) ??
    clientes.find((client) => client?.correoElectronico?.toLowerCase() === correo) ??
    null
  )
}

export async function listClientReservations(clientId) {
  if (!clientId) return []
  const response = await consultarReservas({
    resIdCliente: clientId,
    pageNumber: 1,
    pageSize: 50,
  })
  return asArray(response?.data)
}

export async function listClientInvoices(clientId) {
  if (!clientId) return []
  const response = await listarFacturasCliente(clientId)
  return asArray(response?.data)
}

export async function getInvoiceDetail(idFactura) {
  if (!idFactura) return null
  const response = await obtenerFactura(idFactura)
  return response?.data ?? null
}

export async function getInvoiceByReservation(idReserva) {
  if (!idReserva) return null
  const response = await obtenerFacturaPorReserva(idReserva)
  return response?.data ?? null
}

export async function createClientReservation(payload) {
  const response = await crearReserva(payload)
  return response?.data ?? null
}

export async function confirmClientReservation(idReserva) {
  const response = await confirmarReserva(idReserva)
  return response?.data ?? null
}

export async function cancelClientReservation(idReserva) {
  const response = await cancelarReserva(idReserva)
  return response?.data ?? null
}

export async function updateClientReservation(idReserva, payload) {
  const response = await actualizarReserva(idReserva, payload)
  return response?.data ?? null
}

export async function getReservationDetail(idReserva) {
  if (!idReserva) return null
  const response = await obtenerReserva(idReserva)
  return response?.data ?? null
}

export function formatReservationStatus(code) {
  const normalized = String(code ?? '').toUpperCase()

  if (['PEN', 'PENDIENTE'].includes(normalized)) return 'Pendiente'
  if (['CON', 'CONFIRMADA'].includes(normalized)) return 'Confirmada'
  if (['CAN', 'CANCELADA'].includes(normalized)) return 'Cancelada'
  if (['FIN', 'FINALIZADA'].includes(normalized)) return 'Finalizada'
  if (['INI', 'EN_CURSO', 'ACTIVA'].includes(normalized)) return 'En curso'

  return normalized || 'Sin estado'
}

export function formatInvoiceStatus(code) {
  const normalized = String(code ?? '').toUpperCase()

  if (['EMI', 'EMITIDA', 'PAGADA'].includes(normalized)) return 'Pagada'
  if (['ANU', 'ANULADA'].includes(normalized)) return 'Anulada'

  return normalized || 'Emitida'
}
