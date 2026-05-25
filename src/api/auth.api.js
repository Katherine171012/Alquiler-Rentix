import api from './axios'
import internoApi from './axiosInterno'

export function login(payload) {
  return api.post('/auth/login', payload)
}

/**
 * Registro de cliente: 1) obtener/crear cliente en MS Clientes, 2) registrar usuario en MS Seguridad.
 */
export async function registerCliente(form) {
  const clienteResponse = await internoApi.post('/clientes/obtener-o-crear', {
    nombres: form.cliNombres ?? form.nombres ?? '',
    apellidos: form.cliApellidos ?? form.apellidos ?? '',
    tipoIdentificacion: form.cliTipoIdentificacion ?? form.tipoIdentificacion ?? 'CED',
    numeroIdentificacion: form.cliNumeroIdentificacion ?? form.numeroIdentificacion ?? '',
    correo: form.cliCorreoElectronico ?? form.correo ?? '',
    telefono: form.cliTelefono ?? form.telefono ?? '',
  })

  const idCliente = clienteResponse?.data?.idCliente
  if (!idCliente) {
    return {
      success: false,
      message: clienteResponse?.message ?? 'No se pudo crear el cliente.',
      data: null,
      errors: clienteResponse?.errors ?? [],
    }
  }

  return api.post('/auth/register', {
    idCliente,
    username: form.username?.trim() ?? '',
    correo: form.correo ?? form.cliCorreoElectronico ?? '',
    password: form.password ?? '',
    nombreRol: 'CLIENTE',
  })
}

export function logout() {
  return api.post('/auth/logout')
}
