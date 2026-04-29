export function esRequerido(valor) {
  return typeof valor === 'string' ? valor.trim().length > 0 : Boolean(valor)
}
