export function getItems(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toNumber(value))
}

export function formatDate(value, options = {}) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    ...options,
  }).format(date)
}

export function formatDateTime(value) {
  return formatDate(value, {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

export function normalizeCode(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
}

export function reservationStateMeta(code) {
  const normalized = normalizeCode(code)

  if (normalized === 'PEN') return { label: 'Pendiente', tone: 'warning' }
  if (normalized === 'CON') return { label: 'Confirmada', tone: 'info' }
  if (normalized === 'CAN') return { label: 'Cancelada', tone: 'danger' }
  if (normalized === 'INI') return { label: 'En curso', tone: 'success' }
  if (normalized === 'FIN') return { label: 'Finalizada', tone: 'neutral' }
  return { label: normalized || 'Sin estado', tone: 'neutral' }
}

export function activeStateMeta(code, activeLabel = 'Activo', inactiveLabel = 'Inactivo') {
  const normalized = normalizeCode(code)
  if (['ACT', 'EMI', 'DIS', 'ACTIVO', 'TRUE'].includes(normalized)) {
    return { label: activeLabel, tone: 'success' }
  }

  if (['PEN', 'PENDIENTE'].includes(normalized)) {
    return { label: 'Pendiente', tone: 'warning' }
  }

  if (['ANU', 'CAN', 'INA', 'INACTIVO', 'FALSE'].includes(normalized)) {
    return { label: inactiveLabel, tone: 'danger' }
  }

  return { label: normalized || '-', tone: 'neutral' }
}

export function invoiceStateMeta(code) {
  const normalized = normalizeCode(code)
  if (normalized === 'EMI') return { label: 'Emitida', tone: 'success' }
  if (normalized === 'PEN') return { label: 'Pendiente', tone: 'warning' }
  if (normalized === 'ANU') return { label: 'Anulada', tone: 'danger' }
  return { label: normalized || '-', tone: 'neutral' }
}

export function vehicleStateMeta(code) {
  const normalized = normalizeCode(code)
  if (normalized === 'DIS') return { label: 'Disponible', tone: 'success' }
  if (normalized === 'MAN') return { label: 'Mantenimiento', tone: 'warning' }
  if (normalized === 'RES') return { label: 'Reservado', tone: 'info' }
  if (normalized === 'INA') return { label: 'Inactivo', tone: 'danger' }
  return { label: normalized || '-', tone: 'neutral' }
}

export function fullName(parts = []) {
  return parts.filter(Boolean).join(' ').trim()
}

export function clienteNombre(cliente, fallbackId = null) {
  return (
    cliente?.nombreCompleto?.trim() ||
    fullName([cliente?.cliNombres, cliente?.cliApellidos]) ||
    cliente?.cliRazonSocial ||
    `Cliente #${fallbackId ?? cliente?.idCliente ?? '-'}`
  )
}

export function conductorNombre(conductor) {
  return fullName([
    conductor?.conNombre1,
    conductor?.conNombre2,
    conductor?.conApellido1,
    conductor?.conApellido2,
  ])
}

export function vehiculoNombre(vehiculo) {
  const marca = vehiculo?.nombreMarca ?? ''
  const modelo = vehiculo?.modeloVehiculo ?? ''
  return fullName([marca, modelo]) || vehiculo?.placaVehiculo || `Vehiculo #${vehiculo?.idVehiculo ?? '-'}`
}
