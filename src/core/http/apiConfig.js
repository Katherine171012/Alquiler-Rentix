function trimTrailingSlash(url) {
  return url?.trim().replace(/\/$/, '') ?? ''
}

/**
 * Base del middleware: auth, reservas, facturas (sin /interno).
 * En Render configurar VITE_API_BASE_URL.
 */
export function getApiBaseUrl() {
  const raw =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    ''
  return trimTrailingSlash(raw)
}

function ensureInternoSuffix(base) {
  const trimmed = trimTrailingSlash(base)
  if (!trimmed) return ''
  if (trimmed.endsWith('/interno')) return trimmed
  return `${trimmed}/interno`
}

/**
 * Base para catálogo, clientes, localizaciones, seguridad interna.
 * En Render configurar VITE_INTERNOS_BASE_URL.
 * Si falta, se deriva de getApiBaseUrl() + /interno.
 */
export function getInternoApiBaseUrl() {
  const explicit = trimTrailingSlash(import.meta.env.VITE_INTERNOS_BASE_URL ?? '')
  if (explicit) return ensureInternoSuffix(explicit)

  return ensureInternoSuffix(getApiBaseUrl())
}

// ── Diagnóstico (siempre visible en consola del navegador) ──
console.log('VITE_API_BASE_URL =', import.meta.env.VITE_API_BASE_URL ?? '(no definida)')
console.log('VITE_INTERNOS_BASE_URL =', import.meta.env.VITE_INTERNOS_BASE_URL ?? '(no definida)')
console.log('[Rentix] API base resuelta:', getApiBaseUrl() || '(vacía — usará el propio origen del frontend)')
console.log('[Rentix] Interno base resuelta:', getInternoApiBaseUrl() || '(vacía)')
