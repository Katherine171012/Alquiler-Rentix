import { getInternoApiBaseUrl } from './apiConfig'
import { createRentixAxios } from './rentixAxios'

const internoBaseUrl = getInternoApiBaseUrl()

if (!internoBaseUrl) {
  console.warn(
    '[Rentix] Base interno vacía. Configure VITE_INTERNOS_BASE_URL o VITE_API_URL/VITE_API_BASE_URL.',
  )
}

export default createRentixAxios(internoBaseUrl)
