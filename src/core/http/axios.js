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
    message: responsePayload?.message ?? error?.message ?? 'Error de red o servidor',
    data: responsePayload?.data ?? null,
    errors: Array.isArray(responsePayload?.errors) ? responsePayload.errors : [],
    status: error?.response?.status ?? 0,
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const authStore = useAuthStore()

  if (authStore.token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${authStore.token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    if (isApiEnvelope(response.data)) {
      return response.data
    }

    return {
      success: true,
      message: 'Operacion exitosa',
      data: response.data,
      errors: [],
    }
  },
  (error) => Promise.reject(normalizeApiError(error)),
)

export default api
