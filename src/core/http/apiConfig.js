function trimTrailingSlash(url) {
  return url?.trim().replace(/\/$/, '') ?? ''
}

/**
 * Base del middleware: auth, reservas, facturas (sin segmento /interno).
 * Render: VITE_API_URL o VITE_API_BASE_URL → https://.../api/v1
 */
export function getApiBaseUrl() {
  const raw =
    import.meta.env.VITE_API_URL ??
    import.meta.env.VITE_API_BASE_URL ??
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
 * Base para catálogo, clientes, localizaciones, seguridad interna, etc.
 * Render: VITE_INTERNOS_BASE_URL → https://.../api/v1/interno
 * Si falta, se deriva de getApiBaseUrl() + /interno.
 */
export function getInternoApiBaseUrl() {
  const explicit = trimTrailingSlash(import.meta.env.VITE_INTERNOS_BASE_URL ?? '')
  if (explicit) return ensureInternoSuffix(explicit)

  return ensureInternoSuffix(getApiBaseUrl())
}

if (import.meta.env.DEV) {
  console.info('[Rentix] API base:', getApiBaseUrl() || '(vacía)')
  console.info('[Rentix] Interno base:', getInternoApiBaseUrl() || '(vacía)')
}
