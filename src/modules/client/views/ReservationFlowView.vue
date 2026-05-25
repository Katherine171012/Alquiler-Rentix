<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Plus,
  UserRound,
} from 'lucide-vue-next'
import { listarPaises } from '../../../api/paises.api'
import { listarCiudadesPorPais } from '../../../api/ciudades.api'
import { consultarLocalizaciones } from '../../../api/localizaciones.api'
import { listarExtras } from '../../../api/extras.api'
import { obtenerVehiculo } from '../../../api/vehiculos.api'
import { useReservaStore } from '../../../stores/reserva.store'
import { construirUrlImagenVehiculo } from '../../../utils/imagenesVehiculo'

const route = useRoute()
const router = useRouter()
const reservaStore = useReservaStore()

const cargando = ref(false)
const error = ref('')
const paises = ref([])
const ciudadesRecogida = ref([])
const ciudadesEntrega = ref([])
const localizacionesRecogida = ref([])
const localizacionesEntrega = ref([])
const mostrandoFormularioConductor = ref(false)
const extrasDisponibles = ref([])

const conductorForm = reactive({
  tipoIdentificacion: 'CED',
  numeroIdentificacion: '',
  conNombre1: '',
  conNombre2: '',
  conApellido1: '',
  conApellido2: '',
  numeroLicencia: '',
  fechaVencimientoLicencia: '',
  edadConductor: 18,
  telefono: '',
  correo: '',
})

const stepMap = {
  'reserva-datos': 1,
  'reserva-extras': 2,
  'reserva-conductor': 3,
}

const currentStep = computed(() => stepMap[route.name] ?? 1)
const diasReserva = computed(() => reservaStore.diasReserva)
const subtotalExtras = computed(() =>
  reservaStore.extras.reduce((total, extra) => total + Number(extra.valor ?? 0) * Math.max(diasReserva.value, 1), 0),
)
const totalEstimado = computed(() => reservaStore.subtotalVehiculo + subtotalExtras.value)

const todasLasLocalizaciones = computed(() => {
  const unique = new Map()
  ;[...localizacionesRecogida.value, ...localizacionesEntrega.value].forEach((item) => {
    unique.set(String(item.idLocalizacion), item)
  })
  return [...unique.values()]
})

const resumenLocalizacionRecogida = computed(() =>
  todasLasLocalizaciones.value.find((item) => String(item.idLocalizacion) === String(reservaStore.idLocalizacionRecogida)),
)
const resumenLocalizacionEntrega = computed(() =>
  todasLasLocalizaciones.value.find((item) => String(item.idLocalizacion) === String(reservaStore.idLocalizacionEntrega)),
)

const titleMap = {
  1: 'Datos de la Reserva',
  2: 'Extras Opcionales',
  3: 'Conductor(es)',
}

const subtitleMap = {
  1: 'Paso 1 de 4: Fechas y ubicacion',
  2: 'Paso 2 de 4: Personaliza tu experiencia',
  3: 'Paso 3 de 4: Agrega los conductores autorizados',
}

function asItems(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

const fechaHoy = new Date().toISOString().slice(0, 10)

const fechaError = computed(() => {
  if (!reservaStore.fechaInicio || !reservaStore.fechaFin) return ''

  if (reservaStore.fechaInicio < fechaHoy) {
    return 'La fecha de recogida no puede ser anterior a hoy.'
  }

  if (reservaStore.fechaFin <= reservaStore.fechaInicio) {
    return 'La fecha de entrega debe ser posterior a la fecha de recogida.'
  }

  return ''
})

function formatDateInput(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

async function cargarBaseReserva() {
  try {
    cargando.value = true
    error.value = ''

    if (!reservaStore.idVehiculo && route.query.idVehiculo) {
      reservaStore.idVehiculo = Number(route.query.idVehiculo)
    }

    if (!reservaStore.fechaInicio && route.query.fechaInicio) {
      reservaStore.setFechas({
        inicio: formatDateInput(route.query.fechaInicio),
        fin: formatDateInput(route.query.fechaFin),
      })
    }

    if (!reservaStore.vehiculo && reservaStore.idVehiculo) {
      const vehiculoResponse = await obtenerVehiculo(reservaStore.idVehiculo)
      reservaStore.setVehiculoSeleccionado(vehiculoResponse?.data ?? null)
    }

    const paisesResponse = await listarPaises({ soloActivos: true })
    paises.value = Array.isArray(paisesResponse?.data) ? paisesResponse.data : []
    const extrasResponse = await listarExtras({ soloActivos: true, inactivosAlFinal: true })
    extrasDisponibles.value = asItems(extrasResponse?.data)

    if (reservaStore.idPaisRecogida) {
      await cargarCiudadesRecogida(reservaStore.idPaisRecogida)
    }
    if (reservaStore.idCiudadRecogida) {
      await cargarLocalizacionesRecogida(reservaStore.idCiudadRecogida)
    }
    if (reservaStore.idPaisEntrega) {
      await cargarCiudadesEntrega(reservaStore.idPaisEntrega)
    }
    if (reservaStore.idCiudadEntrega) {
      await cargarLocalizacionesEntrega(reservaStore.idCiudadEntrega)
    }
  } catch (err) {
    error.value = err?.message ?? 'No se pudo cargar el flujo de reserva.'
  } finally {
    cargando.value = false
  }
}

async function cargarCiudadesRecogida(idPais) {
  if (!idPais) {
    ciudadesRecogida.value = []
    return
  }

  const response = await listarCiudadesPorPais(idPais, { soloActivos: true })
  ciudadesRecogida.value = Array.isArray(response?.data) ? response.data : []
}

async function cargarCiudadesEntrega(idPais) {
  if (!idPais) {
    ciudadesEntrega.value = []
    return
  }

  const response = await listarCiudadesPorPais(idPais, { soloActivos: true })
  ciudadesEntrega.value = Array.isArray(response?.data) ? response.data : []
}

async function cargarLocalizacionesRecogida(idCiudad) {
  if (!idCiudad) {
    localizacionesRecogida.value = []
    return
  }

  const response = await consultarLocalizaciones({
    idCiudad,
    soloActivos: true,
    pageNumber: 1,
    pageSize: 100,
  })
  localizacionesRecogida.value = Array.isArray(response?.data?.items) ? response.data.items : []
}

async function cargarLocalizacionesEntrega(idCiudad) {
  if (!idCiudad) {
    localizacionesEntrega.value = []
    return
  }

  const response = await consultarLocalizaciones({
    idCiudad,
    soloActivos: true,
    pageNumber: 1,
    pageSize: 100,
  })
  localizacionesEntrega.value = Array.isArray(response?.data?.items) ? response.data.items : []
}

function toggleExtra(extra) {
  const exists = reservaStore.extras.some((item) => Number(item.idExtra) === Number(extra.idExtra))
  if (exists) {
    reservaStore.extras = reservaStore.extras.filter((item) => Number(item.idExtra) !== Number(extra.idExtra))
    return
  }

  reservaStore.extras = [
    ...reservaStore.extras,
    {
      idExtra: extra.idExtra,
      codigoExtra: extra.codigoExtra,
      nombre: extra.nombreExtra,
      descripcion: extra.descripcionExtra,
      valor: Number(extra.valorFijo ?? 0),
      cantidad: 1,
    },
  ]
}

function validarPasoDatos() {
  if (fechaError.value) {
    error.value = fechaError.value
    return false
  }

  if (!reservaStore.fechaInicio || !reservaStore.fechaFin) {
    error.value = 'Debes seleccionar fecha de recogida y fecha de entrega.'
    return false
  }

  if (diasReserva.value <= 0) {
    error.value = 'La fecha de entrega debe ser posterior a la fecha de recogida.'
    return false
  }

  if (!reservaStore.idLocalizacionRecogida || !reservaStore.idLocalizacionEntrega) {
    error.value = 'Selecciona los puntos de recogida y entrega.'
    return false
  }

  return true
}

function continuar() {
  error.value = ''

  if (currentStep.value === 1 && !validarPasoDatos()) {
    return
  }

  if (currentStep.value === 1) {
    reservaStore.setPasoActual(2)
    router.push('/reserva/extras')
    return
  }

  if (currentStep.value === 2) {
    reservaStore.setPasoActual(3)
    router.push('/reserva/conductor')
    return
  }

  if (!reservaStore.conductores.length) {
    error.value = 'Debe agregar al menos un conductor antes de continuar.'
    return
  }

  const principales = reservaStore.conductores.filter((c) => c.principal)
  if (principales.length !== 1) {
    error.value = 'Debe existir exactamente un conductor marcado como principal.'
    return
  }

  const faltanCampos = reservaStore.conductores.some(
    (c) => !c.numeroIdentificacion || !c.conNombre1 || !c.conApellido1 || !c.numeroLicencia || !c.fechaVencimientoLicencia,
  )
  if (faltanCampos) {
    error.value = 'Todos los conductores deben tener los campos obligatorios completos.'
    return
  }

  reservaStore.setPasoActual(4)
  router.push('/reserva/pago')
}

function volver() {
  if (currentStep.value === 1) {
    router.push(`/vehiculos/${reservaStore.idVehiculo}`)
    return
  }

  if (currentStep.value === 2) {
    reservaStore.setPasoActual(1)
    router.push('/reserva/datos')
    return
  }

  reservaStore.setPasoActual(2)
  router.push('/reserva/extras')
}

const conductorFormError = ref('')

function resetConductorForm() {
  conductorForm.tipoIdentificacion = 'CED'
  conductorForm.numeroIdentificacion = ''
  conductorForm.conNombre1 = ''
  conductorForm.conNombre2 = ''
  conductorForm.conApellido1 = ''
  conductorForm.conApellido2 = ''
  conductorForm.numeroLicencia = ''
  conductorForm.fechaVencimientoLicencia = ''
  conductorForm.edadConductor = 18
  conductorForm.telefono = ''
  conductorForm.correo = ''
  conductorFormError.value = ''
}

function guardarConductor() {
  conductorFormError.value = ''

  if (
    !conductorForm.numeroIdentificacion ||
    !conductorForm.conNombre1 ||
    !conductorForm.conApellido1 ||
    !conductorForm.numeroLicencia ||
    !conductorForm.fechaVencimientoLicencia
  ) {
    conductorFormError.value = 'Completa identificación, nombre, apellido, licencia y vencimiento.'
    return
  }

  const soloTexto = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/
  if (!soloTexto.test(conductorForm.conNombre1) || !soloTexto.test(conductorForm.conApellido1)) {
    conductorFormError.value = 'Los nombres y apellidos solo deben contener letras.'
    return
  }

  if (reservaStore.fechaFin && conductorForm.fechaVencimientoLicencia < reservaStore.fechaFin) {
    conductorFormError.value = `La licencia vence antes de la fecha de entrega (${reservaStore.fechaFin}). El conductor debe tener licencia vigente durante toda la reserva.`
    return
  }

  reservaStore.addConductor({
    tipoIdentificacion: conductorForm.tipoIdentificacion,
    numeroIdentificacion: conductorForm.numeroIdentificacion.trim(),
    conNombre1: conductorForm.conNombre1.trim(),
    conNombre2: conductorForm.conNombre2.trim(),
    conApellido1: conductorForm.conApellido1.trim(),
    conApellido2: conductorForm.conApellido2.trim(),
    nombreCompleto: [
      conductorForm.conNombre1,
      conductorForm.conNombre2,
      conductorForm.conApellido1,
      conductorForm.conApellido2,
    ]
      .filter(Boolean)
      .join(' ')
      .trim(),
    numeroLicencia: conductorForm.numeroLicencia.trim(),
    fechaVencimientoLicencia: conductorForm.fechaVencimientoLicencia,
    edadConductor: Number(conductorForm.edadConductor || 18),
    telefono: conductorForm.telefono.trim(),
    correo: conductorForm.correo.trim(),
  })

  resetConductorForm()
  mostrandoFormularioConductor.value = false
}

function cancelarConductor() {
  mostrandoFormularioConductor.value = false
  resetConductorForm()
}

function marcarPrincipal(index) {
  reservaStore.conductores = reservaStore.conductores.map((c, i) => ({
    ...c,
    principal: i === index,
  }))
}

function quitarConductor(index) {
  reservaStore.conductores = reservaStore.conductores.filter((_, i) => i !== index)
  if (reservaStore.conductores.length > 0 && !reservaStore.conductores.some((c) => c.principal)) {
    reservaStore.conductores[0].principal = true
  }
}

onMounted(cargarBaseReserva)

watch(
  () => [reservaStore.fechaInicio, reservaStore.fechaFin],
  () => {
    if (fechaError.value) {
      error.value = fechaError.value
      return
    }

    if (
      error.value === 'La fecha de entrega debe ser posterior a la fecha de recogida.' ||
      error.value === 'La fecha de recogida no puede ser anterior a hoy.'
    ) {
      error.value = ''
    }
  },
)

watch(
  () => reservaStore.idPaisRecogida,
  async (idPais, previous) => {
    if (idPais === previous) return
    reservaStore.setUbicacionRecogida({ pais: idPais, ciudad: '', localizacion: '' })
    ciudadesRecogida.value = []
    localizacionesRecogida.value = []
    if (!idPais) return
    try {
      await cargarCiudadesRecogida(idPais)
    } catch (err) {
      error.value = err?.message ?? 'No se pudieron cargar las ciudades de recogida.'
    }
  },
)

watch(
  () => reservaStore.idCiudadRecogida,
  async (idCiudad, previous) => {
    if (idCiudad === previous) return
    reservaStore.setUbicacionRecogida({
      pais: reservaStore.idPaisRecogida,
      ciudad: idCiudad,
      localizacion: '',
    })
    localizacionesRecogida.value = []
    if (!idCiudad) return
    try {
      await cargarLocalizacionesRecogida(idCiudad)
    } catch (err) {
      error.value = err?.message ?? 'No se pudieron cargar las localizaciones de recogida.'
    }
  },
)

watch(
  () => reservaStore.idPaisEntrega,
  async (idPais, previous) => {
    if (idPais === previous) return
    reservaStore.setUbicacionEntrega({ pais: idPais, ciudad: '', localizacion: '' })
    ciudadesEntrega.value = []
    localizacionesEntrega.value = []
    if (!idPais) return
    try {
      await cargarCiudadesEntrega(idPais)
    } catch (err) {
      error.value = err?.message ?? 'No se pudieron cargar las ciudades de entrega.'
    }
  },
)

watch(
  () => reservaStore.idCiudadEntrega,
  async (idCiudad, previous) => {
    if (idCiudad === previous) return
    reservaStore.setUbicacionEntrega({
      pais: reservaStore.idPaisEntrega,
      ciudad: idCiudad,
      localizacion: '',
    })
    localizacionesEntrega.value = []
    if (!idCiudad) return
    try {
      await cargarLocalizacionesEntrega(idCiudad)
    } catch (err) {
      error.value = err?.message ?? 'No se pudieron cargar las localizaciones de entrega.'
    }
  },
)
</script>

<template>
  <section class="flow-view">
    <div class="flow-view__inner">
      <nav class="flow-breadcrumb">
        <RouterLink to="/vehiculos">Vehiculos</RouterLink>
        <span>/</span>
        <span>{{ reservaStore.vehiculo?.nombreMarca }} {{ reservaStore.vehiculo?.modeloVehiculo }}</span>
        <span>/</span>
        <span>{{ currentStep === 3 ? 'Reservar' : titleMap[currentStep] }}</span>
      </nav>

      <header class="flow-header">
        <h1>{{ titleMap[currentStep] }}</h1>
        <p>{{ subtitleMap[currentStep] }}</p>
      </header>

      <p v-if="cargando" class="feedback">Cargando informacion de reserva...</p>
      <p v-else-if="error" class="feedback feedback--error">{{ error }}</p>

      <div v-else class="flow-layout">
        <section class="flow-panel">
          <template v-if="currentStep === 1">
            <article class="flow-card">
              <h2>Fechas de Renta</h2>

              <div v-if="fechaError" class="alert alert-danger py-2" role="alert">
                {{ fechaError }}
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Fecha de Recogida *</label>
                  <div class="input-group">
                    <span class="input-group-text"><CalendarDays :size="18" /></span>
                    <input
                      v-model="reservaStore.fechaInicio"
                      type="date"
                      class="form-control"
                      :class="{ 'is-invalid': fechaError && !reservaStore.fechaInicio }"
                      :min="fechaHoy"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Fecha de Entrega *</label>
                  <div class="input-group">
                    <span class="input-group-text"><CalendarDays :size="18" /></span>
                    <input
                      v-model="reservaStore.fechaFin"
                      type="date"
                      class="form-control"
                      :class="{ 'is-invalid': fechaError && !reservaStore.fechaFin }"
                      :min="reservaStore.fechaInicio || fechaHoy"
                    />
                  </div>
                </div>
              </div>
            </article>

            <article class="flow-card">
              <h2>Ubicaciones</h2>
              <div class="flow-grid flow-grid--single">
                <div class="location-block">
                  <h3>Recogida</h3>
                  <div class="flow-grid location-block__grid">
                    <label class="field">
                      <span>Pais</span>
                      <div class="field__input">
                        <MapPin :size="20" />
                        <select v-model="reservaStore.idPaisRecogida">
                          <option value="">Selecciona un pais</option>
                          <option v-for="pais in paises" :key="pais.idPais" :value="String(pais.idPais)">
                            {{ pais.nombrePais }}
                          </option>
                        </select>
                      </div>
                    </label>

                    <label class="field">
                      <span>Ciudad</span>
                      <div class="field__input">
                        <MapPin :size="20" />
                        <select v-model="reservaStore.idCiudadRecogida" :disabled="!reservaStore.idPaisRecogida">
                          <option value="">Selecciona una ciudad</option>
                          <option v-for="ciudad in ciudadesRecogida" :key="ciudad.idCiudad" :value="String(ciudad.idCiudad)">
                            {{ ciudad.nombreCiudad }}
                          </option>
                        </select>
                      </div>
                    </label>

                    <label class="field">
                      <span>Localizacion</span>
                      <div class="field__input">
                        <MapPin :size="20" />
                        <select
                          v-model="reservaStore.idLocalizacionRecogida"
                          :disabled="!reservaStore.idCiudadRecogida"
                        >
                          <option value="">Selecciona una localizacion</option>
                          <option
                            v-for="localizacion in localizacionesRecogida"
                            :key="localizacion.idLocalizacion"
                            :value="String(localizacion.idLocalizacion)"
                          >
                            {{ localizacion.nombreLocalizacion }}
                          </option>
                        </select>
                      </div>
                    </label>
                  </div>
                </div>

                <div class="location-block">
                  <h3>Entrega</h3>
                  <div class="flow-grid location-block__grid">
                    <label class="field">
                      <span>Pais</span>
                      <div class="field__input">
                        <MapPin :size="20" />
                        <select v-model="reservaStore.idPaisEntrega">
                          <option value="">Selecciona un pais</option>
                          <option v-for="pais in paises" :key="`entrega-${pais.idPais}`" :value="String(pais.idPais)">
                            {{ pais.nombrePais }}
                          </option>
                        </select>
                      </div>
                    </label>

                    <label class="field">
                      <span>Ciudad</span>
                      <div class="field__input">
                        <MapPin :size="20" />
                        <select v-model="reservaStore.idCiudadEntrega" :disabled="!reservaStore.idPaisEntrega">
                          <option value="">Selecciona una ciudad</option>
                          <option v-for="ciudad in ciudadesEntrega" :key="`entrega-${ciudad.idCiudad}`" :value="String(ciudad.idCiudad)">
                            {{ ciudad.nombreCiudad }}
                          </option>
                        </select>
                      </div>
                    </label>

                    <label class="field">
                      <span>Localizacion</span>
                      <div class="field__input">
                        <MapPin :size="20" />
                        <select
                          v-model="reservaStore.idLocalizacionEntrega"
                          :disabled="!reservaStore.idCiudadEntrega"
                        >
                          <option value="">Selecciona una localizacion</option>
                          <option
                            v-for="localizacion in localizacionesEntrega"
                            :key="`entrega-${localizacion.idLocalizacion}`"
                            :value="String(localizacion.idLocalizacion)"
                          >
                            {{ localizacion.nombreLocalizacion }}
                          </option>
                        </select>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </article>
          </template>

          <template v-else-if="currentStep === 2">
            <article class="flow-card">
              <h2>Extras Disponibles</h2>
              <div class="extras-list">
                <button
                  v-for="extra in extrasDisponibles"
                  :key="extra.idExtra"
                  type="button"
                  class="extra-card"
                  :class="{ 'extra-card--active': reservaStore.extras.some((item) => Number(item.idExtra) === Number(extra.idExtra)) }"
                  @click="toggleExtra(extra)"
                >
                  <div>
                    <strong>{{ extra.nombreExtra }}</strong>
                    <span>{{ extra.descripcionExtra }}</span>
                  </div>
                  <b>${{ Number(extra.valorFijo ?? 0) }}/dia</b>
                </button>
              </div>
            </article>
          </template>

          <template v-else>
            <article class="flow-card">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="mb-0">Conductores Autorizados</h2>
                <button
                  v-if="!mostrandoFormularioConductor"
                  type="button"
                  class="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                  @click="mostrandoFormularioConductor = true"
                >
                  <Plus :size="16" />
                  Agregar Conductor
                </button>
              </div>

              <!-- Empty state -->
              <div
                v-if="!reservaStore.conductores.length && !mostrandoFormularioConductor"
                class="text-center py-5 border border-2 border-dashed rounded-3"
              >
                <UserRound :size="56" class="text-secondary mb-3" />
                <p class="text-muted fs-5 mb-3">No has agregado conductores</p>
                <button type="button" class="btn btn-primary" @click="mostrandoFormularioConductor = true">
                  Agregar Primer Conductor
                </button>
              </div>

              <!-- Formulario agregar conductor -->
              <div v-if="mostrandoFormularioConductor" class="card border-0 bg-light mb-3">
                <div class="card-body">
                  <h6 class="card-title mb-3">Nuevo Conductor</h6>

                  <div v-if="conductorFormError" class="alert alert-danger py-2 mb-3" role="alert">
                    {{ conductorFormError }}
                  </div>

                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">Tipo de Identificación *</label>
                      <select v-model="conductorForm.tipoIdentificacion" class="form-select">
                        <option value="CED">Cédula</option>
                        <option value="PAS">Pasaporte</option>
                        <option value="RUC">RUC</option>
                      </select>
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Número de Identificación *</label>
                      <input v-model="conductorForm.numeroIdentificacion" type="text" class="form-control" placeholder="Ej: 1723456789" />
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Primer Nombre *</label>
                      <input v-model="conductorForm.conNombre1" type="text" class="form-control" placeholder="Ej: Juan" />
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Segundo Nombre</label>
                      <input v-model="conductorForm.conNombre2" type="text" class="form-control" placeholder="Ej: Carlos" />
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Primer Apellido *</label>
                      <input v-model="conductorForm.conApellido1" type="text" class="form-control" placeholder="Ej: Pérez" />
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Segundo Apellido</label>
                      <input v-model="conductorForm.conApellido2" type="text" class="form-control" placeholder="Ej: Gómez" />
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Número de Licencia *</label>
                      <input v-model="conductorForm.numeroLicencia" type="text" class="form-control" placeholder="Ej: LIC123456" />
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Vencimiento de Licencia *</label>
                      <div class="input-group">
                        <span class="input-group-text"><CalendarDays :size="16" /></span>
                        <input
                          v-model="conductorForm.fechaVencimientoLicencia"
                          type="date"
                          class="form-control"
                          :class="{ 'is-invalid': conductorFormError && !conductorForm.fechaVencimientoLicencia }"
                          :min="reservaStore.fechaFin || fechaHoy"
                        />
                      </div>
                      <div class="form-text text-muted">
                        Debe ser válida hasta al menos la fecha de entrega.
                      </div>
                    </div>

                    <div class="col-md-4">
                      <label class="form-label">Edad *</label>
                      <input v-model.number="conductorForm.edadConductor" type="number" class="form-control" min="18" max="99" />
                    </div>

                    <div class="col-md-4">
                      <label class="form-label">Teléfono</label>
                      <input v-model="conductorForm.telefono" type="text" class="form-control" placeholder="Ej: 0999999999" />
                    </div>

                    <div class="col-md-4">
                      <label class="form-label">Correo</label>
                      <input v-model="conductorForm.correo" type="email" class="form-control" placeholder="conductor@correo.com" />
                    </div>
                  </div>

                  <div class="d-flex gap-2 mt-3">
                    <button type="button" class="btn btn-primary" @click="guardarConductor">
                      <Check :size="16" class="me-1" />
                      Agregar
                    </button>
                    <button type="button" class="btn btn-outline-secondary" @click="cancelarConductor">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>

              <!-- Lista de conductores como tarjetas Bootstrap -->
              <div v-if="reservaStore.conductores.length" class="row g-3">
                <div
                  v-for="(conductor, index) in reservaStore.conductores"
                  :key="conductor.id"
                  class="col-md-6"
                >
                  <div class="card h-100" :class="conductor.principal ? 'border-primary' : ''">
                    <div class="card-body pb-2">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0">{{ conductor.nombreCompleto }}</h6>
                        <span v-if="conductor.principal" class="badge bg-primary">Principal</span>
                      </div>

                      <ul class="list-unstyled small text-muted mb-0">
                        <li>
                          <strong>{{ conductor.tipoIdentificacion }}:</strong>
                          {{ conductor.numeroIdentificacion }}
                        </li>
                        <li>
                          <strong>Licencia:</strong> {{ conductor.numeroLicencia }}
                        </li>
                        <li v-if="conductor.fechaVencimientoLicencia">
                          <strong>Vence:</strong> {{ conductor.fechaVencimientoLicencia }}
                        </li>
                        <li v-if="conductor.telefono">
                          <strong>Tel:</strong> {{ conductor.telefono }}
                        </li>
                        <li v-if="conductor.correo">
                          <strong>Correo:</strong> {{ conductor.correo }}
                        </li>
                      </ul>
                    </div>
                    <div class="card-footer bg-transparent d-flex gap-2">
                      <button
                        v-if="!conductor.principal"
                        type="button"
                        class="btn btn-outline-primary btn-sm"
                        @click="marcarPrincipal(index)"
                      >
                        Marcar como principal
                      </button>
                      <button
                        type="button"
                        class="btn btn-outline-danger btn-sm ms-auto"
                        @click="quitarConductor(index)"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </template>

          <footer class="flow-actions">
            <button type="button" class="btn-secondary btn-secondary--wide" @click="volver">
              <ArrowLeft :size="18" />
              Volver
            </button>

            <button type="button" class="btn-primary btn-primary--wide" @click="continuar">
              Continuar
              <ArrowRight :size="18" />
            </button>
          </footer>
        </section>

        <aside class="summary-card">
          <h2>Resumen</h2>
          <img
            v-if="reservaStore.vehiculo"
            :src="construirUrlImagenVehiculo(reservaStore.vehiculo.imagenVehiculo)"
            :alt="`${reservaStore.vehiculo.nombreMarca} ${reservaStore.vehiculo.modeloVehiculo}`"
          />
          <h3>{{ reservaStore.vehiculo?.nombreMarca }} {{ reservaStore.vehiculo?.modeloVehiculo }}</h3>
          <p>{{ reservaStore.vehiculo?.nombreCategoria }}</p>

          <div class="summary-row">
            <span>Precio por dia</span>
            <strong>${{ Number(reservaStore.vehiculo?.precioBaseDia ?? 0).toFixed(0) }}</strong>
          </div>
          <div class="summary-row" v-if="diasReserva > 0">
            <span>Vehiculo ({{ diasReserva }} dias)</span>
            <strong>${{ reservaStore.subtotalVehiculo.toFixed(0) }}</strong>
          </div>
          <div class="summary-row" v-if="subtotalExtras > 0">
            <span>Extras</span>
            <strong>${{ subtotalExtras.toFixed(0) }}</strong>
          </div>
          <div class="summary-row summary-row--total" v-if="diasReserva > 0">
            <span>Total</span>
            <strong>${{ totalEstimado.toFixed(0) }}</strong>
          </div>

          <div class="summary-meta" v-if="resumenLocalizacionRecogida || resumenLocalizacionEntrega">
            <p><strong>Recogida:</strong> {{ resumenLocalizacionRecogida?.nombreLocalizacion || 'No definida' }}</p>
            <p><strong>Entrega:</strong> {{ resumenLocalizacionEntrega?.nombreLocalizacion || 'No definida' }}</p>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<style scoped>
.flow-view {
  padding: 2rem 1rem 4rem;
}

.flow-view__inner {
  width: min(100%, 1120px);
  margin: 0 auto;
}

.flow-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  color: var(--color-text-muted);
}

.flow-breadcrumb a {
  color: inherit;
  text-decoration: none;
}

.flow-header {
  margin: 2rem 0 1.8rem;
}

.flow-header h1 {
  margin: 0;
  font-size: clamp(2.4rem, 4vw, 3.5rem);
  letter-spacing: -0.04em;
}

.flow-header p {
  margin: 0.75rem 0 0;
  color: var(--color-text-muted);
  font-size: 1.15rem;
}

.flow-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 2rem;
  align-items: start;
}

.flow-panel {
  display: grid;
  gap: 1.4rem;
}

.flow-card,
.summary-card,
.feedback {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1.6rem;
}

.flow-card {
  padding: 1.8rem;
}

.flow-card h2,
.summary-card h2 {
  margin: 0 0 1.3rem;
  font-size: 1.25rem;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}

.flow-grid--single {
  grid-template-columns: 1fr;
}

.location-block {
  padding: 1.2rem;
  border: 1px solid var(--color-border);
  border-radius: 1.2rem;
  background: #fafafa;
}

.location-block h3 {
  margin: 0 0 1rem;
  font-size: 1.05rem;
}

.location-block__grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 0.55rem;
}

.field span {
  font-size: 0.95rem;
  font-weight: 700;
}

.field__input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.7rem;
  padding: 0 1rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
}

.field__input svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.field__input input,
.field__input select {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 1rem;
}

.flow-card__title-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.flow-actions .btn-primary,
.flow-actions .btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 3.7rem;
  padding: 0 1.2rem;
  border-radius: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.flow-actions .btn-primary {
  border: none;
  background: linear-gradient(135deg, #7b173b, #571027);
  color: #fff;
}

.flow-actions .btn-secondary {
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
}

.btn-primary--wide,
.btn-secondary--wide {
  min-width: 180px;
}

.extras-list {
  display: grid;
  gap: 1rem;
}

.extra-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  text-align: left;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  border: 1px solid var(--color-border);
  background: #fafafa;
  cursor: pointer;
}

.extra-card strong,
.extra-card span {
  display: block;
}

.extra-card span {
  margin-top: 0.25rem;
  color: var(--color-text-muted);
}

.extra-card--active {
  border-color: #a61b4c;
  background: #fff6f8;
}


.flow-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.summary-card {
  padding: 1.8rem;
}

.summary-card img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 1rem;
}

.summary-card h3 {
  margin: 1.2rem 0 0.4rem;
  font-size: 2rem;
}

.summary-card p {
  margin: 0 0 1.2rem;
  color: var(--color-text-muted);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 0;
  border-top: 1px solid var(--color-border);
}

.summary-row--total strong {
  font-size: 1.8rem;
  color: var(--color-primary);
}

.summary-meta {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.summary-meta p {
  margin: 0 0 0.5rem;
  color: var(--color-text-soft);
}

.feedback {
  padding: 1rem;
  text-align: center;
}

.feedback--error {
  color: #b42318;
}


@media (max-width: 980px) {
  .flow-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .flow-grid,
  .flow-actions {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .flow-card__title-row,
  .conductor-item {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
