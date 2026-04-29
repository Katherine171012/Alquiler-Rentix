export function guardarLocal(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor))
}

export function leerLocal(clave, valorPorDefecto = null) {
  const raw = localStorage.getItem(clave)
  if (!raw) return valorPorDefecto
  try {
    return JSON.parse(raw)
  } catch {
    return valorPorDefecto
  }
}
