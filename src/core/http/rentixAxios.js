import axios from 'axios'
import { useAuthStore } from '../../stores/auth.store'

function isApiEnvelope(payload) {
  return (
    payload &&
    typeof payload === 'object' &&
    Object.hasOwn(payload, 'success') &&
    Object.hasOwn(payload, 'message')
  )
}

function normalizeApiError(error) {
  const responsePayload = error?.response?.data

  if (isApiEnvelope(responsePayload)) {
    return {
      ...responsePayload,
      status: error.response?.status ?? 0,
    }
  }

  return {
    success: false,
    message:
      responsePayload?.message ??
      error?.message ??
      'No se pudo conectar con el servidor. Intenta nuevamente.',
    data: responsePayload?.data ?? null,
    errors: Array.isArray(responsePayload?.errors) ? responsePayload.errors : [],
    status: error.response?.status ?? 0,
  }
}

/** Cliente axios con envelope Rentix y token JWT. */
export function createRentixAxios(baseURL) {
  const client = axios.create({
    baseURL,
    timeout: 15000,
  })

  client.interceptors.request.use((config) => {
    const authStore = useAuthStore()

    if (authStore.token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    return config
  })

  client.interceptors.response.use(
    (response) => {
      if (isApiEnvelope(response.data)) {
        return response.data
      }

      return {
        success: true,
        message: 'Operación exitosa',
        data: response.data,
        errors: [],
      }
    },
    (error) => Promise.reject(normalizeApiError(error)),
  )

  return client
}
