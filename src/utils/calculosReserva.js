export function calcularDiasReserva(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return 0
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)
  const diff = fin.getTime() - inicio.getTime()
  if (Number.isNaN(diff) || diff < 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
