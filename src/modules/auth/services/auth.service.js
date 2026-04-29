import api from '../../../core/http/axios'

export function loginRequest(payload) {
  return api.post('/auth/login', payload)
}
