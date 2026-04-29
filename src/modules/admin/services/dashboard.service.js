import api from '../../../core/http/axios'

function asArray(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function monthKey(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  if (!key) return ''
  const [year, month] = key.split('-')
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
  return new Intl.DateTimeFormat('es-EC', { month: 'short' }).format(date)
}

function parseReservationDate(reserva) {
  return reserva?.resFechaInicio ?? reserva?.fechaInicio ?? reserva?.fechaCreacionUtc ?? null
}

function isReservationActive(state) {
  const normalized = String(state ?? '')
    .trim()
    .toUpperCase()
  return ['PEN', 'CON', 'ACT', 'INI'].includes(normalized)
}

function reservationStatusLabel(state) {
  const normalized = String(state ?? '')
    .trim()
    .toUpperCase()

  if (normalized === 'PEN') return 'Pendiente'
  if (normalized === 'CON') return 'Confirmada'
  if (normalized === 'CAN') return 'Cancelada'
  if (normalized === 'ACT' || normalized === 'INI') return 'Activa'
  if (normalized === 'FIN') return 'Finalizada'
  return normalized || 'Sin estado'
}

function reservationStatusVariant(state) {
  const normalized = String(state ?? '')
    .trim()
    .toUpperCase()

  if (normalized === 'ACT' || normalized === 'INI') return 'success'
  if (normalized === 'CON') return 'info'
  if (normalized === 'PEN') return 'warning'
  if (normalized === 'CAN') return 'danger'
  return 'neutral'
}

function vehicleCategoryLabel(vehicle) {
  return vehicle?.nombreCategoria ?? vehicle?.categoriaNombre ?? `Categoria ${vehicle?.idCategoria ?? 'N/A'}`
}

function vehicleDisplayName(vehicle) {
  return vehicle?.nombreVehiculo ?? `${vehicle?.modeloVehiculo ?? 'Vehiculo'} ${vehicle?.placaVehiculo ?? ''}`.trim()
}

function clientDisplayName(client) {
  const fullName = `${client?.cliNombres ?? ''} ${client?.cliApellidos ?? ''}`.trim()
  return fullName || client?.cliRazonSocial || `Cliente ${client?.idCliente ?? 'N/A'}`
}

function buildLookupMap(items = [], keyName, getValue) {
  return items.reduce((accumulator, item) => {
    const key = item?.[keyName]
    if (!key) return accumulator
    accumulator[key] = getValue(item)
    return accumulator
  }, {})
}

function sortByDateDesc(items, getDateValue) {
  return [...items].sort((left, right) => {
    const leftDate = Date.parse(getDateValue(left) ?? '')
    const rightDate = Date.parse(getDateValue(right) ?? '')
    return (Number.isNaN(rightDate) ? 0 : rightDate) - (Number.isNaN(leftDate) ? 0 : leftDate)
  })
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toNumber(amount))
}

async function fetchDashboardData() {
  const [clientesResponse, vehiculosResponse, reservasResponse, facturasResponse] = await Promise.all([
    api.get('/clientes?soloActivos=true'),
    api.get('/vehiculos'),
    api.get('/reservas/consulta?pageNumber=1&pageSize=200'),
    api.get('/facturas/consulta?pageNumber=1&pageSize=200'),
  ])

  if (!clientesResponse?.success) throw new Error(clientesResponse?.message ?? 'No se pudo cargar clientes')
  if (!vehiculosResponse?.success) throw new Error(vehiculosResponse?.message ?? 'No se pudo cargar vehiculos')
  if (!reservasResponse?.success) throw new Error(reservasResponse?.message ?? 'No se pudo cargar reservas')
  if (!facturasResponse?.success) throw new Error(facturasResponse?.message ?? 'No se pudo cargar facturas')

  const clientes = asArray(clientesResponse.data)
  const vehiculos = asArray(vehiculosResponse.data)
  const reservas = asArray(reservasResponse.data)
  const facturas = asArray(facturasResponse.data)

  const vehiculosDisponibles = vehiculos.filter((vehicle) => {
    const state = String(vehicle?.estadoVehiculo ?? '')
      .trim()
      .toUpperCase()
    return ['ACT', 'DIS'].includes(state)
  }).length

  const reservasActivas = reservas.filter((reservation) => isReservationActive(reservation?.resEstado)).length
  const ingresosTotales = facturas.reduce((total, invoice) => total + toNumber(invoice?.facTotal), 0)

  const monthlyRevenueMap = facturas.reduce((accumulator, invoice) => {
    const key = monthKey(invoice?.facFechaEmisionUtc ?? invoice?.fechaEmisionUtc)
    if (!key) return accumulator
    accumulator[key] = (accumulator[key] ?? 0) + toNumber(invoice?.facTotal)
    return accumulator
  }, {})

  const monthlyRevenue = Object.entries(monthlyRevenueMap)
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([key, total]) => ({
      key,
      label: monthLabel(key),
      total,
    }))

  const categoryMap = vehiculos.reduce((accumulator, vehicle) => {
    const label = vehicleCategoryLabel(vehicle)
    accumulator[label] = (accumulator[label] ?? 0) + 1
    return accumulator
  }, {})

  const vehiclesByCategory = Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count)

  const statusMap = reservas.reduce((accumulator, reservation) => {
    const code = String(reservation?.resEstado ?? '')
      .trim()
      .toUpperCase()
    accumulator[code] = (accumulator[code] ?? 0) + 1
    return accumulator
  }, {})

  const reservationStatuses = Object.entries(statusMap)
    .map(([code, count]) => ({
      code,
      label: reservationStatusLabel(code),
      count,
      variant: reservationStatusVariant(code),
    }))
    .sort((left, right) => right.count - left.count)

  const vehicleNameById = buildLookupMap(vehiculos, 'idVehiculo', vehicleDisplayName)
  const clientNameById = buildLookupMap(clientes, 'idCliente', clientDisplayName)

  const recentReservations = sortByDateDesc(reservas, parseReservationDate)
    .slice(0, 5)
    .map((reservation) => ({
      id: reservation?.idReserva,
      vehicleName: vehicleNameById[reservation?.resIdVehiculo] ?? `Vehiculo #${reservation?.resIdVehiculo ?? '-'}`,
      clientName: clientNameById[reservation?.resIdCliente] ?? `Cliente #${reservation?.resIdCliente ?? '-'}`,
      amount: formatCurrency(reservation?.resTotal),
      date: parseReservationDate(reservation),
      status: reservationStatusLabel(reservation?.resEstado),
      statusVariant: reservationStatusVariant(reservation?.resEstado),
    }))

  return {
    kpis: {
      vehiculosDisponibles,
      reservasActivas,
      clientesActivos: clientes.length,
      ingresosTotales,
    },
    monthlyRevenue,
    vehiclesByCategory,
    reservationStatuses,
    recentReservations,
  }
}

export { fetchDashboardData, formatCurrency }
