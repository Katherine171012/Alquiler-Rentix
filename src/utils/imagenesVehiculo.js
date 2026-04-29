const DEFAULT_IMAGE =
  'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'

function esUrlAbsoluta(valor = '') {
  return /^https?:\/\//i.test(valor)
}

export function construirUrlImagenVehiculo(imagenVehiculo) {
  if (!imagenVehiculo) return DEFAULT_IMAGE

  if (esUrlAbsoluta(imagenVehiculo)) {
    return imagenVehiculo
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  if (!cloudName) return DEFAULT_IMAGE

  const nombreLimpio = String(imagenVehiculo).replace(/^\/+/, '')
  const publicIdSinExtension = nombreLimpio
    .replace(/^vehiculos\//, '')
    .replace(/\.[a-zA-Z0-9]+$/, '')

  return `https://res.cloudinary.com/${cloudName}/image/upload/vehiculos/${publicIdSinExtension}.png`
}

export function obtenerNombreImagenDesdePlaca(placa = '') {
  const limpia = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  return limpia ? `${limpia}.png` : ''
}
