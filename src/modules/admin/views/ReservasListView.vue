<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Ban, CalendarDays, CheckCircle2, Eye, Pencil, Plus, UserRound, Wrench } from 'lucide-vue-next'
import { useAuthStore } from '../../../stores/auth.store'
import { listarCiudadesPorPais } from '../../../api/ciudades.api'
import { listarClientes } from '../../../api/clientes.api'
import { listarConductores } from '../../../api/conductores.api'
import { listarExtras } from '../../../api/extras.api'
import { consultarLocalizaciones } from '../../../api/localizaciones.api'
import { listarPaises } from '../../../api/paises.api'
import {
  cancelarReserva,
  consultarDisponibilidadVehiculos,
  confirmarReserva,
  consultarReservas,
  crearReserva,
  actualizarReserva,
  obtenerReserva,
} from '../../../api/reservas.api'
import { asignarConductorReserva, listarConductoresReserva } from '../../../api/reservasConductor.api'
import { agregarExtraReserva, listarExtrasReserva } from '../../../api/reservasExtra.api'
import { listarVehiculos } from '../../../api/vehiculos.api'
import { AdminEmptyState, AdminModal, AdminPageHeader, AdminSearchBar, AdminStatusBadge } from '../components'
import {
  clienteNombre,
  conductorNombre,
  formatCurrency,
  formatDate,
  getItems,
  reservationStateMeta,
  vehiculoNombre,
} from '../utils/panel'

const authStore = useAuthStore()

const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchTerm = ref('')
const reservas = ref([])
const clientes = ref([])
const vehiculos = ref([])
const conductores = ref([])
const extrasCatalog = ref([])
const paises = ref([])
const ciudadesReserva = ref([])
const localizacionesReserva = ref([])
const vehiculosDisponibles = ref([])
const selectedReserva = ref(null)
const activeModal = ref('')

const createForm = ref(createReservaForm())
const editForm = ref(createEditReservaForm())

function createReservaForm() {
  return {
    resIdCliente: '',
    resIdVehiculo: '',
    resIdPais: '',
    resIdCiudad: '',
    resIdLocalizacion: '',
    resFechaInicio: '',
    resFechaFin: '',
    resPrecioPorDia: '',
    resObservacion: '',
    conductorPrincipalId: '',
    conductoresSecundarios: [],
    extras: [],
  }
}

function createEditReservaForm() {
  return {
    idReserva: '',
    resFechaInicio: '',
    resFechaFin: '',
    resPrecioPorDia: '',
    resEstado: 'PEN',
    resObservacion: '',
    conductorPrincipalId: '',
    conductoresSecundarios: [],
    extras: [],
  }
}

const vehiculoOptions = computed(() =>
  vehiculos.value.map((vehiculo) => ({
    id: vehiculo.idVehiculo,
    label: `${vehiculoNombre(vehiculo)} · ${vehiculo.placaVehiculo ?? ''}`.trim(),
    precio: vehiculo.precioBaseDia ?? 0,
  })),
)

const vehiculoDisponiblesOptions = computed(() =>
  vehiculosDisponibles.value.map((item) => ({
    id: item.vehiculo?.idVehiculo,
    label: `${vehiculoNombre(item.vehiculo)} · ${item.vehiculo?.placaVehiculo ?? ''}`.trim(),
    precio: item.precioPorDiaCongelado ?? item.vehiculo?.precioBaseDia ?? 0,
  })),
)

const clienteOptions = computed(() =>
  clientes.value.map((cliente) => ({
    id: cliente.idCliente,
    label: `${clienteNombre(cliente)} · ${cliente.cliNumeroIdentificacion ?? ''}`.trim(),
  })),
)

const conductorOptions = computed(() =>
  conductores.value.map((conductor) => ({
    id: conductor.idConductor,
    label: `${conductorNombre(conductor)} · ${conductor.numeroLicencia ?? ''}`.trim(),
  })),
)

const extraOptions = computed(() =>
  extrasCatalog.value.map((extra) => ({
    id: extra.idExtra,
    label: `${extra.nombreExtra} · ${formatCurrency(extra.valorFijo)}/dia`,
    valorFijo: extra.valorFijo ?? 0,
  })),
)

const filteredReservas = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return reservas.value

  return reservas.value.filter((reserva) => {
    const haystack = [
      reserva.resNumeroPublico,
      nombreClienteReserva(reserva),
      reserva.cliente?.correoElectronico,
      nombreVehiculoReserva(reserva),
      reserva.vehiculo?.placaVehiculo,
      reservationStateMeta(reserva.resEstado).label,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  })
})

const detailTitle = computed(() => {
  if (!selectedReserva.value) return 'Detalle de Reserva'
  return `Detalle de Reserva ${selectedReserva.value.resNumeroPublico || `#${selectedReserva.value.idReserva}`}`
})

function nombreClienteReserva(reserva) {
  return reserva?.cliente?.nombreCompleto?.trim() || clienteNombre(reserva?.cliente, reserva?.resIdCliente)
}

function nombreVehiculoReserva(reserva) {
  return (
    reserva?.vehiculo?.modeloVehiculo?.trim() ||
    reserva?.vehiculo?.placaVehiculo ||
    `Vehiculo #${reserva?.resIdVehiculo ?? reserva?.vehiculo?.idVehiculo ?? '-'}`
  )
}

function resetMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function syncPrecioVehiculo() {
  const selected = vehiculoDisponiblesOptions.value.find(
    (item) => String(item.id) === String(createForm.value.resIdVehiculo),
  )
  if (selected && !createForm.value.resPrecioPorDia) {
    createForm.value.resPrecioPorDia = selected.precio
  }
}

function syncExtraPrice(collection, index) {
  const row = collection[index]
  const selected = extraOptions.value.find((item) => String(item.id) === String(row.rxeIdExtra))
  if (selected && !row.rxePrecioPorDia) {
    row.rxePrecioPorDia = selected.valorFijo
  }
}

function addCreateExtraRow() {
  createForm.value.extras.push({
    rxeIdExtra: '',
    rxeCantidad: 1,
    rxePrecioPorDia: '',
  })
}

function addCreateSecondaryDriverRow() {
  createForm.value.conductoresSecundarios.push('')
}

function addEditSecondaryDriverRow() {
  editForm.value.conductoresSecundarios.push('')
}

function removeCreateSecondaryDriverRow(index) {
  createForm.value.conductoresSecundarios.splice(index, 1)
}

function removeEditSecondaryDriverRow(index) {
  editForm.value.conductoresSecundarios.splice(index, 1)
}

function addEditExtraRow() {
  editForm.value.extras.push({
    rxeIdExtra: '',
    rxeCantidad: 1,
    rxePrecioPorDia: '',
  })
}

function removeCreateExtraRow(index) {
  createForm.value.extras.splice(index, 1)
}

function removeEditExtraRow(index) {
  editForm.value.extras.splice(index, 1)
}

async function loadReservas() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [
      reservasResponse,
      clientesResponse,
      vehiculosResponse,
      conductoresResponse,
      extrasResponse,
      paisesResponse,
    ] = await Promise.all([
      consultarReservas({ pageNumber: 1, pageSize: 200 }),
      listarClientes(),
      listarVehiculos(),
      listarConductores(),
      listarExtras(),
      listarPaises({ soloActivos: true }),
    ])

    reservas.value = getItems(reservasResponse.data)
    clientes.value = getItems(clientesResponse.data)
    vehiculos.value = getItems(vehiculosResponse.data)
    conductores.value = getItems(conductoresResponse.data)
    extrasCatalog.value = getItems(extrasResponse.data)
    paises.value = getItems(paisesResponse.data)
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudieron cargar las reservas.'
  } finally {
    isLoading.value = false
  }
}

async function hydrateReservationAssignments(idReserva) {
  const [conductoresReservaResponse, extrasReservaResponse] = await Promise.all([
    listarConductoresReserva(idReserva),
    listarExtrasReserva(idReserva),
  ])

  return {
    conductores: getItems(conductoresReservaResponse.data),
    extras: getItems(extrasReservaResponse.data),
  }
}

async function openDetail(idReserva) {
  try {
    const [response, assignments] = await Promise.all([
      obtenerReserva(idReserva),
      hydrateReservationAssignments(idReserva),
    ])

    selectedReserva.value = {
      ...response.data,
      conductores: assignments.conductores,
      extras: assignments.extras,
    }
    activeModal.value = 'detail'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo obtener el detalle de la reserva.'
  }
}

async function openEdit(idReserva) {
  try {
    const [response, assignments] = await Promise.all([
      obtenerReserva(idReserva),
      hydrateReservationAssignments(idReserva),
    ])

    selectedReserva.value = {
      ...response.data,
      conductores: assignments.conductores,
      extras: assignments.extras,
    }

    editForm.value = {
      idReserva: response.data.idReserva,
      resFechaInicio: toDateTimeLocal(response.data.resFechaInicio),
      resFechaFin: toDateTimeLocal(response.data.resFechaFin),
      resPrecioPorDia: response.data.resPrecioPorDia ?? '',
      resEstado: response.data.resEstado ?? 'PEN',
      resObservacion: response.data.resObservacion ?? '',
      conductorPrincipalId: assignments.conductores.find((item) => item.rxcEsPrincipal)?.rxcIdConductor ?? '',
      conductoresSecundarios: assignments.conductores
        .filter((item) => !item.rxcEsPrincipal)
        .map((item) => item.rxcIdConductor),
      extras: assignments.extras.map((item) => ({
        rxeIdExtra: item.rxeIdExtra,
        rxeCantidad: item.rxeCantidad,
        rxePrecioPorDia: item.rxePrecioPorDia,
      })),
    }

    activeModal.value = 'edit'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo cargar la reserva para edicion.'
  }
}

function closeModal() {
  activeModal.value = ''
  selectedReserva.value = null
  createForm.value = createReservaForm()
  editForm.value = createEditReservaForm()
  ciudadesReserva.value = []
  localizacionesReserva.value = []
  vehiculosDisponibles.value = []
}

async function cargarCiudadesReserva(idPais) {
  if (!idPais) {
    ciudadesReserva.value = []
    return
  }

  const response = await listarCiudadesPorPais(idPais, { soloActivos: true })
  ciudadesReserva.value = getItems(response.data)
}

async function cargarLocalizacionesReserva(idCiudad) {
  if (!idCiudad) {
    localizacionesReserva.value = []
    return
  }

  const response = await consultarLocalizaciones({
    idCiudad,
    soloActivos: true,
    pageNumber: 1,
    pageSize: 100,
  })
  localizacionesReserva.value = getItems(response.data)
}

async function cargarVehiculosDisponibles() {
  const { resIdLocalizacion, resFechaInicio, resFechaFin } = createForm.value
  if (!resIdLocalizacion || !resFechaInicio || !resFechaFin) {
    vehiculosDisponibles.value = []
    return
  }

  const response = await consultarDisponibilidadVehiculos({
    idLocalizacion: Number(resIdLocalizacion),
    fechaInicioUtc: new Date(resFechaInicio).toISOString(),
    fechaFinUtc: new Date(resFechaFin).toISOString(),
  })

  vehiculosDisponibles.value = getItems(response.data)
}

async function assignReservationResources(
  idReserva,
  conductorPrincipalId,
  conductoresSecundarios = [],
  extrasRows = [],
  existingReservation = null,
) {
  const tasks = []

  const existingPrincipal = existingReservation?.conductores?.find((item) => item.rxcEsPrincipal)
  if (conductorPrincipalId && Number(conductorPrincipalId) !== Number(existingPrincipal?.rxcIdConductor)) {
    tasks.push(
      asignarConductorReserva({
        rxcIdReserva: Number(idReserva),
        rxcIdConductor: Number(conductorPrincipalId),
        rxcEsPrincipal: true,
      }),
    )
  }

  const existingSecondaryIds = new Set(
    (existingReservation?.conductores ?? [])
      .filter((item) => !item.rxcEsPrincipal)
      .map((item) => Number(item.rxcIdConductor)),
  )

  for (const conductorId of conductoresSecundarios) {
    if (!conductorId) continue
    if (Number(conductorId) === Number(conductorPrincipalId)) continue
    if (existingSecondaryIds.has(Number(conductorId))) continue

    tasks.push(
      asignarConductorReserva({
        rxcIdReserva: Number(idReserva),
        rxcIdConductor: Number(conductorId),
        rxcEsPrincipal: false,
      }),
    )
  }

  const existingExtraIds = new Set((existingReservation?.extras ?? []).map((item) => Number(item.rxeIdExtra)))
  for (const extra of extrasRows) {
    if (!extra.rxeIdExtra) continue
    if (existingExtraIds.has(Number(extra.rxeIdExtra))) continue

    tasks.push(
      agregarExtraReserva({
        rxeIdReserva: Number(idReserva),
        rxeIdExtra: Number(extra.rxeIdExtra),
        rxeCantidad: Number(extra.rxeCantidad),
        rxePrecioPorDia: Number(extra.rxePrecioPorDia),
      }),
    )
  }

  if (tasks.length) {
    await Promise.all(tasks)
  }
}

async function submitCreate() {
  isSubmitting.value = true
  resetMessages()

  try {
    const response = await crearReserva({
      resIdCliente: Number(createForm.value.resIdCliente),
      resIdVehiculo: Number(createForm.value.resIdVehiculo),
      resFechaInicio: createForm.value.resFechaInicio,
      resFechaFin: createForm.value.resFechaFin,
      resPrecioPorDia: Number(createForm.value.resPrecioPorDia),
      resObservacion: createForm.value.resObservacion || null,
      resCreadoPorUsuario: authStore.user?.username ?? 'admin',
    })

    const idReserva = response.data?.idReserva
    if (idReserva) {
      await assignReservationResources(
        idReserva,
        createForm.value.conductorPrincipalId,
        createForm.value.conductoresSecundarios,
        createForm.value.extras,
      )
    }

    successMessage.value = 'Reserva creada correctamente.'
    closeModal()
    await loadReservas()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo crear la reserva.'
  } finally {
    isSubmitting.value = false
  }
}

async function submitEdit() {
  isSubmitting.value = true
  resetMessages()

  try {
    await actualizarReserva(editForm.value.idReserva, {
      idReserva: Number(editForm.value.idReserva),
      resFechaInicio: editForm.value.resFechaInicio,
      resFechaFin: editForm.value.resFechaFin,
      resPrecioPorDia: Number(editForm.value.resPrecioPorDia),
      resEstado: editForm.value.resEstado,
      resObservacion: editForm.value.resObservacion || null,
      resModificadoPorUsuario: authStore.user?.username ?? 'admin',
      resModificadoDesde: 'web',
    })

    await assignReservationResources(
      editForm.value.idReserva,
      editForm.value.conductorPrincipalId,
      editForm.value.conductoresSecundarios,
      editForm.value.extras,
      selectedReserva.value,
    )

    successMessage.value = 'Reserva actualizada correctamente.'
    closeModal()
    await loadReservas()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo actualizar la reserva.'
  } finally {
    isSubmitting.value = false
  }
}

async function runReservationAction(action, idReserva) {
  resetMessages()

  try {
    if (action === 'confirm') {
      await confirmarReserva(idReserva)
      successMessage.value = 'Reserva confirmada correctamente.'
    }

    if (action === 'cancel') {
      await cancelarReserva(idReserva)
      successMessage.value = 'Reserva cancelada correctamente.'
    }

    await loadReservas()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo ejecutar la accion.'
  }
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

onMounted(loadReservas)

watch(
  () => createForm.value.resIdPais,
  async (value, previous) => {
    if (value === previous) return
    createForm.value.resIdCiudad = ''
    createForm.value.resIdLocalizacion = ''
    createForm.value.resIdVehiculo = ''
    createForm.value.resPrecioPorDia = ''
    ciudadesReserva.value = []
    localizacionesReserva.value = []
    vehiculosDisponibles.value = []
    if (!value) return
    try {
      await cargarCiudadesReserva(value)
    } catch (error) {
      errorMessage.value = error?.message ?? 'No se pudieron cargar las ciudades.'
    }
  },
)

watch(
  () => createForm.value.resIdCiudad,
  async (value, previous) => {
    if (value === previous) return
    createForm.value.resIdLocalizacion = ''
    createForm.value.resIdVehiculo = ''
    createForm.value.resPrecioPorDia = ''
    localizacionesReserva.value = []
    vehiculosDisponibles.value = []
    if (!value) return
    try {
      await cargarLocalizacionesReserva(value)
    } catch (error) {
      errorMessage.value = error?.message ?? 'No se pudieron cargar las localizaciones.'
    }
  },
)

watch(
  () => [createForm.value.resIdLocalizacion, createForm.value.resFechaInicio, createForm.value.resFechaFin],
  async ([localizacion, fechaInicio, fechaFin], previous = []) => {
    if (localizacion === previous[0] && fechaInicio === previous[1] && fechaFin === previous[2]) return
    createForm.value.resIdVehiculo = ''
    createForm.value.resPrecioPorDia = ''
    vehiculosDisponibles.value = []
    if (!localizacion || !fechaInicio || !fechaFin) return
    try {
      await cargarVehiculosDisponibles()
    } catch (error) {
      errorMessage.value = error?.message ?? 'No se pudo consultar la disponibilidad de vehiculos.'
    }
  },
)
</script>

<template>
  <section class="admin-page">
    <AdminPageHeader title="Reservas" description="Gestion de reservas y alquileres">
      <button type="button" class="admin-button" @click="activeModal = 'create'">
        <Plus :size="18" />
        <span>Nueva Reserva</span>
      </button>
    </AdminPageHeader>

    <p v-if="errorMessage" class="admin-state-message admin-state-message--error">{{ errorMessage }}</p>
    <p v-else-if="successMessage" class="admin-state-message admin-state-message--success">{{ successMessage }}</p>

    <div class="admin-card">
      <div class="admin-card__section">
        <AdminSearchBar v-model="searchTerm" placeholder="Buscar reserva por cliente, vehiculo o estado..." />
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Vehiculo</th>
              <th>Fechas</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody v-if="!isLoading && filteredReservas.length">
            <tr v-for="reserva in filteredReservas" :key="reserva.idReserva">
              <td>
                <strong>{{ reserva.resNumeroPublico || `#${reserva.idReserva}` }}</strong>
              </td>
              <td>
                <strong>{{ nombreClienteReserva(reserva) }}</strong>
                <div class="admin-note">{{ reserva.cliente?.correoElectronico || '-' }}</div>
              </td>
              <td>
                <strong>{{ nombreVehiculoReserva(reserva) }}</strong>
                <div class="admin-note">{{ reserva.vehiculo?.nombreCategoria || reserva.vehiculo?.placaVehiculo }}</div>
              </td>
              <td>
                <div>{{ formatDate(reserva.resFechaInicio) }}</div>
                <div class="admin-note">{{ formatDate(reserva.resFechaFin) }}</div>
              </td>
              <td>
                <strong>{{ formatCurrency(reserva.resTotal) }}</strong>
              </td>
              <td>
                <AdminStatusBadge v-bind="reservationStateMeta(reserva.resEstado)" />
              </td>
              <td>
                <div class="admin-actions">
                  <button type="button" class="admin-icon-button" title="Ver detalle" @click="openDetail(reserva.idReserva)">
                    <Eye :size="17" />
                  </button>
                  <button type="button" class="admin-icon-button" title="Editar" @click="openEdit(reserva.idReserva)">
                    <Pencil :size="17" />
                  </button>
                  <button
                    v-if="reserva.resEstado === 'PEN'"
                    type="button"
                    class="admin-icon-button admin-icon-button--success"
                    title="Confirmar"
                    @click="runReservationAction('confirm', reserva.idReserva)"
                  >
                    <CheckCircle2 :size="17" />
                  </button>
                  <button
                    v-if="!['CAN', 'FIN'].includes(reserva.resEstado)"
                    type="button"
                    class="admin-icon-button admin-icon-button--danger"
                    title="Cancelar"
                    @click="runReservationAction('cancel', reserva.idReserva)"
                  >
                    <Ban :size="17" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="isLoading" class="admin-card__section">
          <p class="admin-state-message">Cargando reservas...</p>
        </div>

        <div v-else-if="!filteredReservas.length" class="admin-card__section">
          <AdminEmptyState
            title="No hay reservas para mostrar"
            description="Ajusta la busqueda o registra una nueva reserva desde el panel."
          >
            <template #icon>
              <CalendarDays :size="26" />
            </template>
          </AdminEmptyState>
        </div>
      </div>
    </div>

    <AdminModal v-if="activeModal === 'create'" title="Nueva Reserva" @close="closeModal">
      <form class="admin-form" @submit.prevent="submitCreate">
        <div class="admin-grid admin-grid--2">
          <div class="admin-field">
            <label for="res-cliente">Cliente *</label>
            <select id="res-cliente" v-model="createForm.resIdCliente" required>
              <option value="">Seleccionar cliente...</option>
              <option v-for="cliente in clienteOptions" :key="cliente.id" :value="cliente.id">
                {{ cliente.label }}
              </option>
            </select>
          </div>

          <div class="admin-field">
            <label for="res-pais">Pais *</label>
            <select id="res-pais" v-model="createForm.resIdPais" required>
              <option value="">Seleccionar pais...</option>
              <option v-for="pais in paises" :key="pais.idPais" :value="String(pais.idPais)">
                {{ pais.nombrePais }}
              </option>
            </select>
          </div>
        </div>

        <div class="admin-grid admin-grid--3">
          <div class="admin-field">
            <label for="res-ciudad">Ciudad *</label>
            <select id="res-ciudad" v-model="createForm.resIdCiudad" :disabled="!createForm.resIdPais" required>
              <option value="">Seleccionar ciudad...</option>
              <option v-for="ciudad in ciudadesReserva" :key="ciudad.idCiudad" :value="String(ciudad.idCiudad)">
                {{ ciudad.nombreCiudad }}
              </option>
            </select>
          </div>

          <div class="admin-field">
            <label for="res-localizacion">Localizacion *</label>
            <select
              id="res-localizacion"
              v-model="createForm.resIdLocalizacion"
              :disabled="!createForm.resIdCiudad"
              required
            >
              <option value="">Seleccionar localizacion...</option>
              <option
                v-for="localizacion in localizacionesReserva"
                :key="localizacion.idLocalizacion"
                :value="String(localizacion.idLocalizacion)"
              >
                {{ localizacion.nombreLocalizacion }}
              </option>
            </select>
          </div>

          <div class="admin-field">
            <label for="res-vehiculo">Vehiculo *</label>
            <select
              id="res-vehiculo"
              v-model="createForm.resIdVehiculo"
              :disabled="!createForm.resIdLocalizacion || !createForm.resFechaInicio || !createForm.resFechaFin"
              required
              @change="syncPrecioVehiculo"
            >
              <option value="">Seleccionar vehiculo disponible...</option>
              <option v-for="vehiculo in vehiculoDisponiblesOptions" :key="vehiculo.id" :value="vehiculo.id">
                {{ vehiculo.label }}
              </option>
            </select>
            <small class="admin-note">
              Selecciona pais, ciudad, localizacion y fechas para consultar disponibilidad.
            </small>
          </div>
        </div>

        <div class="admin-grid admin-grid--2">
          <div class="admin-field">
            <label for="res-fecha-inicio">Fecha de inicio *</label>
            <input id="res-fecha-inicio" v-model="createForm.resFechaInicio" type="datetime-local" required />
          </div>

          <div class="admin-field">
            <label for="res-fecha-fin">Fecha de fin *</label>
            <input id="res-fecha-fin" v-model="createForm.resFechaFin" type="datetime-local" required />
          </div>
        </div>

        <div class="admin-field">
          <label for="res-precio">Precio por dia *</label>
          <input id="res-precio" v-model="createForm.resPrecioPorDia" type="number" min="0" step="0.01" required />
        </div>

        <div class="admin-field">
          <label for="res-obs">Observacion</label>
          <textarea id="res-obs" v-model="createForm.resObservacion" placeholder="Notas operativas o de entrega" />
        </div>

        <div class="admin-card">
          <div class="admin-card__section">
            <div class="reservas-form__section-title">
              <UserRound :size="18" />
              <strong>Conductor principal</strong>
            </div>
            <div class="admin-field">
              <label>Conductor autorizado</label>
              <select v-model="createForm.conductorPrincipalId">
                <option value="">Sin asignar por ahora</option>
                <option v-for="conductor in conductorOptions" :key="conductor.id" :value="conductor.id">
                  {{ conductor.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="admin-card__section">
            <div class="reservas-form__section-head">
              <div class="reservas-form__section-title">
                <UserRound :size="18" />
                <strong>Conductores secundarios</strong>
              </div>
              <button type="button" class="admin-button--secondary" @click="addCreateSecondaryDriverRow">
                Agregar conductor
              </button>
            </div>

            <div v-if="createForm.conductoresSecundarios.length" class="reservas-extra-list">
              <div
                v-for="(conductorId, index) in createForm.conductoresSecundarios"
                :key="`create-driver-${index}`"
                class="reservas-secondary-row"
              >
                <select v-model="createForm.conductoresSecundarios[index]">
                  <option value="">Seleccionar conductor...</option>
                  <option
                    v-for="conductor in conductorOptions.filter(
                      (option) => String(option.id) !== String(createForm.conductorPrincipalId),
                    )"
                    :key="conductor.id"
                    :value="conductor.id"
                  >
                    {{ conductor.label }}
                  </option>
                </select>
                <button
                  type="button"
                  class="admin-icon-button admin-icon-button--danger"
                  @click="removeCreateSecondaryDriverRow(index)"
                >
                  <Ban :size="16" />
                </button>
              </div>
            </div>

            <p v-else class="admin-note">No se han agregado conductores secundarios.</p>
          </div>

          <div class="admin-card__section">
            <div class="reservas-form__section-head">
              <div class="reservas-form__section-title">
                <Wrench :size="18" />
                <strong>Extras</strong>
              </div>
              <button type="button" class="admin-button--secondary" @click="addCreateExtraRow">Agregar extra</button>
            </div>

            <div v-if="createForm.extras.length" class="reservas-extra-list">
              <div v-for="(extra, index) in createForm.extras" :key="`create-extra-${index}`" class="reservas-extra-row">
                <select v-model="extra.rxeIdExtra" @change="syncExtraPrice(createForm.extras, index)">
                  <option value="">Seleccionar extra...</option>
                  <option v-for="option in extraOptions" :key="option.id" :value="option.id">
                    {{ option.label }}
                  </option>
                </select>
                <input v-model="extra.rxeCantidad" type="number" min="1" placeholder="Cantidad" />
                <input v-model="extra.rxePrecioPorDia" type="number" min="0" step="0.01" placeholder="Precio por dia" />
                <button type="button" class="admin-icon-button admin-icon-button--danger" @click="removeCreateExtraRow(index)">
                  <Ban :size="16" />
                </button>
              </div>
            </div>

            <p v-else class="admin-note">No se han agregado extras a esta reserva.</p>
          </div>
        </div>
      </form>

      <template #footer>
        <button type="button" class="admin-button--secondary" @click="closeModal">Cancelar</button>
        <button type="button" class="admin-button" :disabled="isSubmitting" @click="submitCreate">
          {{ isSubmitting ? 'Creando...' : 'Crear Reserva' }}
        </button>
      </template>
    </AdminModal>

    <AdminModal v-if="activeModal === 'edit'" title="Editar Reserva" @close="closeModal">
      <form class="admin-form" @submit.prevent="submitEdit">
        <div class="admin-grid admin-grid--2">
          <div class="admin-field">
            <label>Fecha de inicio *</label>
            <input v-model="editForm.resFechaInicio" type="datetime-local" required />
          </div>

          <div class="admin-field">
            <label>Fecha de fin *</label>
            <input v-model="editForm.resFechaFin" type="datetime-local" required />
          </div>
        </div>

        <div class="admin-grid admin-grid--2">
          <div class="admin-field">
            <label>Precio por dia *</label>
            <input v-model="editForm.resPrecioPorDia" type="number" min="0" step="0.01" required />
          </div>

          <div class="admin-field">
            <label>Estado *</label>
            <select v-model="editForm.resEstado" required>
              <option value="PEN">Pendiente</option>
              <option value="CON">Confirmada</option>
              <option value="INI">En curso</option>
              <option value="FIN">Finalizada</option>
              <option value="CAN">Cancelada</option>
            </select>
          </div>
        </div>

        <div class="admin-field">
          <label>Observacion</label>
          <textarea v-model="editForm.resObservacion" />
        </div>

        <div class="admin-card">
          <div class="admin-card__section">
            <div class="reservas-form__section-title">
              <UserRound :size="18" />
              <strong>Conductor principal</strong>
            </div>
            <div class="admin-field">
              <label>Conductor autorizado</label>
              <select v-model="editForm.conductorPrincipalId">
                <option value="">Sin asignar por ahora</option>
                <option v-for="conductor in conductorOptions" :key="conductor.id" :value="conductor.id">
                  {{ conductor.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="admin-card__section">
            <div class="reservas-form__section-head">
              <div class="reservas-form__section-title">
                <UserRound :size="18" />
                <strong>Conductores secundarios</strong>
              </div>
              <button type="button" class="admin-button--secondary" @click="addEditSecondaryDriverRow">
                Agregar conductor
              </button>
            </div>

            <div v-if="editForm.conductoresSecundarios.length" class="reservas-extra-list">
              <div
                v-for="(conductorId, index) in editForm.conductoresSecundarios"
                :key="`edit-driver-${index}`"
                class="reservas-secondary-row"
              >
                <select v-model="editForm.conductoresSecundarios[index]">
                  <option value="">Seleccionar conductor...</option>
                  <option
                    v-for="conductor in conductorOptions.filter(
                      (option) => String(option.id) !== String(editForm.conductorPrincipalId),
                    )"
                    :key="conductor.id"
                    :value="conductor.id"
                  >
                    {{ conductor.label }}
                  </option>
                </select>
                <button
                  type="button"
                  class="admin-icon-button admin-icon-button--danger"
                  @click="removeEditSecondaryDriverRow(index)"
                >
                  <Ban :size="16" />
                </button>
              </div>
            </div>

            <p v-else class="admin-note">No hay conductores secundarios asociados todavia.</p>
          </div>

          <div class="admin-card__section">
            <div class="reservas-form__section-head">
              <div class="reservas-form__section-title">
                <Wrench :size="18" />
                <strong>Extras</strong>
              </div>
              <button type="button" class="admin-button--secondary" @click="addEditExtraRow">Agregar extra</button>
            </div>

            <div v-if="editForm.extras.length" class="reservas-extra-list">
              <div v-for="(extra, index) in editForm.extras" :key="`edit-extra-${index}`" class="reservas-extra-row">
                <select v-model="extra.rxeIdExtra" @change="syncExtraPrice(editForm.extras, index)">
                  <option value="">Seleccionar extra...</option>
                  <option v-for="option in extraOptions" :key="option.id" :value="option.id">
                    {{ option.label }}
                  </option>
                </select>
                <input v-model="extra.rxeCantidad" type="number" min="1" placeholder="Cantidad" />
                <input v-model="extra.rxePrecioPorDia" type="number" min="0" step="0.01" placeholder="Precio por dia" />
                <button type="button" class="admin-icon-button admin-icon-button--danger" @click="removeEditExtraRow(index)">
                  <Ban :size="16" />
                </button>
              </div>
            </div>

            <p v-else class="admin-note">No hay extras asociados todavia.</p>
          </div>
        </div>
      </form>

      <template #footer>
        <button type="button" class="admin-button--secondary" @click="closeModal">Cancelar</button>
        <button type="button" class="admin-button" :disabled="isSubmitting" @click="submitEdit">
          {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </template>
    </AdminModal>

    <AdminModal v-if="activeModal === 'detail' && selectedReserva" :title="detailTitle" size="lg" @close="closeModal">
      <div class="admin-detail-grid">
        <article class="admin-detail-card">
          <dl>
            <div>
              <dt>Cliente</dt>
              <dd>{{ nombreClienteReserva(selectedReserva) }}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{{ selectedReserva.cliente?.correoElectronico || '-' }}</dd>
            </div>
            <div>
              <dt>Telefono</dt>
              <dd>{{ selectedReserva.cliente?.telefono || '-' }}</dd>
            </div>
          </dl>
        </article>

        <article class="admin-detail-card">
          <dl>
            <div>
              <dt>Vehiculo</dt>
              <dd>{{ nombreVehiculoReserva(selectedReserva) }}</dd>
            </div>
            <div>
              <dt>Placa</dt>
              <dd>{{ selectedReserva.vehiculo?.placaVehiculo || '-' }}</dd>
            </div>
            <div>
              <dt>Categoria</dt>
              <dd>{{ selectedReserva.vehiculo?.nombreCategoria || '-' }}</dd>
            </div>
          </dl>
        </article>

        <article class="admin-detail-card">
          <dl>
            <div>
              <dt>Fecha de inicio</dt>
              <dd>{{ formatDate(selectedReserva.resFechaInicio, { dateStyle: 'full' }) }}</dd>
            </div>
            <div>
              <dt>Fecha de fin</dt>
              <dd>{{ formatDate(selectedReserva.resFechaFin, { dateStyle: 'full' }) }}</dd>
            </div>
          </dl>
        </article>

        <article class="admin-detail-card">
          <dl>
            <div>
              <dt>Total</dt>
              <dd>{{ formatCurrency(selectedReserva.resTotal) }}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>
                <AdminStatusBadge v-bind="reservationStateMeta(selectedReserva.resEstado)" />
              </dd>
            </div>
          </dl>
        </article>

        <article class="admin-detail-card">
          <dl>
            <div>
              <dt>Conductor principal</dt>
              <dd>
                {{
                  selectedReserva.conductores?.find((item) => item.rxcEsPrincipal)?.nombreConductor ||
                  '-'
                }}
              </dd>
            </div>
            <div>
              <dt>Conductores secundarios</dt>
              <dd>{{ selectedReserva.conductores?.filter((item) => !item.rxcEsPrincipal).length || 0 }}</dd>
            </div>
            <div>
              <dt>Total extras</dt>
              <dd>{{ selectedReserva.extras?.length || 0 }}</dd>
            </div>
          </dl>
        </article>
      </div>

      <div class="admin-detail-grid" style="margin-top: 1rem">
        <article class="admin-detail-card">
          <h3 style="margin: 0 0 0.9rem">Conductores asignados</h3>
          <div v-if="selectedReserva.conductores?.length" class="reservas-chip-list">
            <span
              v-for="conductor in selectedReserva.conductores"
              :key="conductor.idReservaXConductor || conductor.rxcIdConductor"
              class="reservas-chip"
            >
              {{ conductor.nombreConductor }}
              <small v-if="conductor.rxcEsPrincipal">Principal</small>
            </span>
          </div>
          <p v-else class="admin-note">No hay conductores asignados.</p>
        </article>

        <article class="admin-detail-card">
          <h3 style="margin: 0 0 0.9rem">Extras asociados</h3>
          <div v-if="selectedReserva.extras?.length" class="reservas-chip-list">
            <span
              v-for="extra in selectedReserva.extras"
              :key="extra.idReservaXExtra || extra.rxeIdExtra"
              class="reservas-chip"
            >
              {{ extra.nombreExtra }} x{{ extra.rxeCantidad }}
              <small>{{ formatCurrency(extra.rxePrecioPorDia) }}/dia</small>
            </span>
          </div>
          <p v-else class="admin-note">No hay extras asociados.</p>
        </article>
      </div>

      <template #footer>
        <button type="button" class="admin-button--secondary" @click="closeModal">Cerrar</button>
        <button type="button" class="admin-button" @click="openEdit(selectedReserva.idReserva)">Editar Reserva</button>
      </template>
    </AdminModal>
  </section>
</template>

<style scoped>
.reservas-form__section-head,
.reservas-form__section-title {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.reservas-form__section-head {
  justify-content: space-between;
  margin-bottom: 1rem;
}

.reservas-extra-list {
  display: grid;
  gap: 0.75rem;
}

.reservas-extra-row {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) 9rem 11rem auto;
  gap: 0.75rem;
  align-items: center;
}

.reservas-extra-row select,
.reservas-extra-row input {
  width: 100%;
  min-height: 3rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 0 1rem;
  background: #fff;
  font: inherit;
}

.reservas-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.reservas-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 0.92rem;
}

.reservas-chip small {
  color: var(--color-text-muted);
}

@media (max-width: 820px) {
  .reservas-extra-row {
    grid-template-columns: 1fr;
  }
}
</style>
