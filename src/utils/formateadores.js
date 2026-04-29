export function formatearMoneda(valor = 0, moneda = 'USD') {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: moneda }).format(valor)
}
