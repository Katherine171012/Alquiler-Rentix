/**
 * URL base del Middleware Interno (debe incluir /api/v1).
 * En Render configurar VITE_API_URL en el build (variables Vite).
 */
export function getApiBaseUrl() {
  return (
    import.meta.env.VITE_API_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_INTERNOS_BASE_URL ??
    ''
  )
}

console.log('API URL:', import.meta.env.VITE_API_URL)
