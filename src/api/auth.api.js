import api from './axios'

export function login(payload) {
  return api.post('/auth/login', payload)
}

export function registerCliente(payload) {
  return api.post('/auth/register-cliente', payload)
}

export function logout() {
  return api.post('/auth/logout')
}
