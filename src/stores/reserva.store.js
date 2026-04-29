import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useReservaStore = defineStore('reserva', () => {
  const pasoActual = ref(1)
  const idVehiculo = ref(null)
  const vehiculo = ref(null)
  const fechaInicio = ref('')
  const fechaFin = ref('')
  const idPaisRecogida = ref('')
  const idCiudadRecogida = ref('')
  const idLocalizacionRecogida = ref('')
  const idPaisEntrega = ref('')
  const idCiudadEntrega = ref('')
  const idLocalizacionEntrega = ref('')
  const conductores = ref([])
  const extras = ref([])
  const reservaConfirmada = ref(null)
  const facturaGenerada = ref(null)

  const diasReserva = computed(() => {
    if (!fechaInicio.value || !fechaFin.value) return 0
    const inicio = new Date(fechaInicio.value)
    const fin = new Date(fechaFin.value)
    const diff = fin.getTime() - inicio.getTime()
    if (Number.isNaN(diff) || diff <= 0) return 0
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  })

  const subtotalVehiculo = computed(() => {
    return Number(vehiculo.value?.precioBaseDia ?? 0) * diasReserva.value
  })

  function setVehiculoSeleccionado(payload) {
    vehiculo.value = payload ?? null
    idVehiculo.value = payload?.idVehiculo ?? null
  }

  function setFechas({ inicio = '', fin = '' }) {
    fechaInicio.value = inicio
    fechaFin.value = fin
  }

  function setUbicacionRecogida({ pais = '', ciudad = '', localizacion = '' } = {}) {
    idPaisRecogida.value = pais
    idCiudadRecogida.value = ciudad
    idLocalizacionRecogida.value = localizacion
  }

  function setUbicacionEntrega({ pais = '', ciudad = '', localizacion = '' } = {}) {
    idPaisEntrega.value = pais
    idCiudadEntrega.value = ciudad
    idLocalizacionEntrega.value = localizacion
  }

  function setLocalizaciones({ recogida = '', entrega = '' }) {
    idLocalizacionRecogida.value = recogida
    idLocalizacionEntrega.value = entrega
  }

  function addConductor(conductor) {
    conductores.value.push({
      ...conductor,
      id: Date.now() + Math.random(),
      principal: conductores.value.length === 0,
    })
  }

  function removeConductor(id) {
    conductores.value = conductores.value.filter((conductor) => conductor.id !== id)
    if (conductores.value.length > 0 && !conductores.value.some((conductor) => conductor.principal)) {
      conductores.value[0].principal = true
    }
  }

  function setConductores(payload = []) {
    conductores.value = payload
  }

  function setExtras(payload = []) {
    extras.value = payload
  }

  function setPasoActual(paso) {
    pasoActual.value = paso
  }

  function hydrateFromReservation(reserva = {}) {
    setVehiculoSeleccionado(reserva?.vehiculo ?? null)
    setFechas({
      inicio: String(reserva?.resFechaInicio ?? '').slice(0, 10),
      fin: String(reserva?.resFechaFin ?? '').slice(0, 10),
    })
    setUbicacionRecogida({
      pais: reserva?.resIdPaisRecogida ?? '',
      ciudad: reserva?.resIdCiudadRecogida ?? '',
      localizacion: reserva?.resIdLocalizacionRecogida ?? '',
    })
    setUbicacionEntrega({
      pais: reserva?.resIdPaisEntrega ?? '',
      ciudad: reserva?.resIdCiudadEntrega ?? '',
      localizacion: reserva?.resIdLocalizacionEntrega ?? '',
    })
    reservaConfirmada.value = reserva ?? null
  }

  function setReservaResultado({ reserva = null, factura = null } = {}) {
    reservaConfirmada.value = reserva
    facturaGenerada.value = factura
  }

  function resetReserva() {
    pasoActual.value = 1
    idVehiculo.value = null
    vehiculo.value = null
    fechaInicio.value = ''
    fechaFin.value = ''
    idPaisRecogida.value = ''
    idCiudadRecogida.value = ''
    idLocalizacionRecogida.value = ''
    idPaisEntrega.value = ''
    idCiudadEntrega.value = ''
    idLocalizacionEntrega.value = ''
    conductores.value = []
    extras.value = []
    reservaConfirmada.value = null
    facturaGenerada.value = null
  }

  return {
    pasoActual,
    idVehiculo,
    vehiculo,
    fechaInicio,
    fechaFin,
    idPaisRecogida,
    idCiudadRecogida,
    idLocalizacionRecogida,
    idPaisEntrega,
    idCiudadEntrega,
    idLocalizacionEntrega,
    conductores,
    extras,
    reservaConfirmada,
    facturaGenerada,
    diasReserva,
    subtotalVehiculo,
    setVehiculoSeleccionado,
    setFechas,
    setUbicacionRecogida,
    setUbicacionEntrega,
    setLocalizaciones,
    addConductor,
    removeConductor,
    setConductores,
    setExtras,
    setPasoActual,
    hydrateFromReservation,
    setReservaResultado,
    resetReserva,
  }
})
