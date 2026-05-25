import { getApiBaseUrl } from './apiConfig'
import { createRentixAxios } from './rentixAxios'

const apiBaseUrl = getApiBaseUrl()

if (!apiBaseUrl) {
  console.warn(
    '[Rentix] VITE_API_URL / VITE_API_BASE_URL no definidas. Las peticiones irán al mismo origen del frontend.',
  )
}

export default createRentixAxios(apiBaseUrl)
