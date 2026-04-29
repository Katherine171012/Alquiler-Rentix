const CLOUDINARY_FOLDER = 'vehiculos'

function getRequiredEnv(name) {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Falta variable de entorno requerida: ${name}`)
  }
  return value
}

export function normalizarPlacaParaPublicId(placa = '') {
  return placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export async function subirImagenVehiculoCloudinary(file, placa) {
  if (!(file instanceof File)) {
    throw new Error('Debe seleccionar una imagen valida')
  }

  const placaNormalizada = normalizarPlacaParaPublicId(placa)
  if (!placaNormalizada) {
    throw new Error('La placa es obligatoria para generar el public_id')
  }

  // Genera un public_id unico por subida para permitir reemplazos sin chocar con cache o conflictos.
  const publicId = `${placaNormalizada}-${Date.now()}`

  const cloudName = getRequiredEnv('VITE_CLOUDINARY_CLOUD_NAME')
  const uploadPreset = getRequiredEnv('VITE_CLOUDINARY_UPLOAD_PRESET')
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  const formData = new FormData()
  formData.append('file', file)
  formData.append('public_id', publicId)
  formData.append('folder', CLOUDINARY_FOLDER)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  })

  const result = await response.json()
  if (!response.ok) {
    throw new Error(result?.error?.message ?? 'No se pudo subir la imagen a Cloudinary')
  }

  return result
}
