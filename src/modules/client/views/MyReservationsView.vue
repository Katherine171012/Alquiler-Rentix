<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, CalendarDays, Pencil, Trash2, X } from 'lucide-vue-next'
import { ADMIN_ROLES } from '../../../core/constants/roles'
import { useAuthStore } from '../../../stores/auth.store'
import {
  cancelClientReservation,
  formatReservationStatus,
  listClientReservations,
  resolveCurrentClient,
  updateClientReservation,
} from '../services/clientPortal.service'

const authStore = useAuthStore()
const router = useRouter()

const cargando = ref(true)
const guardando = ref(false)
const error = ref('')
const exito = ref('')
const reservas = ref([])
const editandoReserva = ref(null)
const mostrarEditor = ref(false)
const cancelandoReserva = ref(null)
const mostrarCancelacion = ref(false)
const editForm = reactive({
  resFechaInicio: '',
  resFechaFin: '',
  resObservacion: '',
})

const hayReservas = computed(() => reservas.value.length > 0)
const puedeEditarDesdePortal = computed(() => authStore.hasAnyRole(ADMIN_ROLES))

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha'
  const date = new Date(valor)
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

async function cargarReservas() {
  try {
    cargando.value = true
    error.value = ''
    const client = await resolveCurrentClient(authStore.user)
    reservas.value = await listClientReservations(client?.idCliente)
  } catch (err) {
    error.value = err?.message ?? 'No se pudieron cargar las reservas.'
  } finally {
    cargando.value = false
  }
}

function puedeEditarReserva(reserva) {
  const estado = String(reserva?.resEstado ?? '').toUpperCase()
  return puedeEditarDesdePortal.value && ['PEN', 'PENDIENTE'].includes(estado)
}

function esReservaPendiente(reserva) {
  const estado = String(reserva?.resEstado ?? '').toUpperCase()
  return ['PEN', 'PENDIENTE'].includes(estado)
}

function abrirEditor(reserva) {
  editandoReserva.value = reserva
  editForm.resFechaInicio = String(reserva?.resFechaInicio ?? '').slice(0, 10)
  editForm.resFechaFin = String(reserva?.resFechaFin ?? '').slice(0, 10)
  editForm.resObservacion = reserva?.resObservacion ?? ''
  mostrarEditor.value = true
  error.value = ''
  exito.value = ''
}

function cerrarEditor() {
  mostrarEditor.value = false
  editandoReserva.value = null
  editForm.resFechaInicio = ''
  editForm.resFechaFin = ''
  editForm.resObservacion = ''
}

function continuarReserva(reserva) {
  router.push({
    path: '/reserva/pago',
    query: { reservaId: reserva.idReserva },
  })
}

function abrirCancelacion(reserva) {
  cancelandoReserva.value = reserva
  mostrarCancelacion.value = true
  error.value = ''
  exito.value = ''
}

function cerrarCancelacion() {
  mostrarCancelacion.value = false
  cancelandoReserva.value = null
}

async function guardarEdicion() {
  if (!editandoReserva.value) return

  if (!editForm.resFechaInicio || !editForm.resFechaFin) {
    error.value = 'Debes completar las fechas para actualizar la reserva.'
    return
  }

  if (new Date(editForm.resFechaFin) <= new Date(editForm.resFechaInicio)) {
    error.value = 'La fecha de fin debe ser posterior a la fecha de inicio.'
    return
  }

  try {
    guardando.value = true
    error.value = ''
    exito.value = ''

    await updateClientReservation(editandoReserva.value.idReserva, {
      idReserva: editandoReserva.value.idReserva,
      resFechaInicio: new Date(editForm.resFechaInicio).toISOString(),
      resFechaFin: new Date(editForm.resFechaFin).toISOString(),
      resPrecioPorDia: Number(
        editandoReserva.value.resPrecioPorDia ?? editandoReserva.value.vehiculo?.precioBaseDia ?? 0,
      ),
      resEstado: editandoReserva.value.resEstado,
      resObservacion: editForm.resObservacion.trim(),
      resModificadoPorUsuario: authStore.user?.username ?? authStore.user?.correo ?? 'cliente-web',
      resModificadoDesde: 'web',
    })

    exito.value = 'Reserva actualizada correctamente.'
    cerrarEditor()
    await cargarReservas()
  } catch (err) {
    error.value =
      err?.status === 403
        ? 'Tu rol actual no tiene permisos para editar reservas desde este portal.'
        : (err?.message ?? 'No se pudo actualizar la reserva.')
  } finally {
    guardando.value = false
  }
}

async function cancelarReservaPendiente() {
  if (!cancelandoReserva.value) return

  try {
    guardando.value = true
    error.value = ''
    exito.value = ''

    await cancelClientReservation(cancelandoReserva.value.idReserva)
    exito.value = 'Reserva cancelada correctamente.'
    cerrarCancelacion()
    await cargarReservas()
  } catch (err) {
    error.value =
      err?.status === 403
        ? 'Tu rol actual no tiene permisos para cancelar esta reserva desde este portal.'
        : (err?.message ?? 'No se pudo cancelar la reserva.')
  } finally {
    guardando.value = false
  }
}

onMounted(cargarReservas)
</script>

<template>
  <section class="reservas-view">
    <header class="reservas-hero">
      <div class="reservas-hero__inner">
        <h1>Mis Reservas</h1>
        <p>Administra tus reservas activas y pasadas</p>
      </div>
    </header>

    <div class="reservas-view__inner">
      <p v-if="cargando" class="feedback">Cargando reservas...</p>
      <p v-else-if="error" class="feedback feedback--error">{{ error }}</p>
      <p v-else-if="exito" class="feedback feedback--success">{{ exito }}</p>

      <article v-else-if="!hayReservas" class="empty-state">
        <CalendarDays :size="72" />
        <h2>No tienes reservas</h2>
        <p>Explora nuestro catalogo y reserva tu primer vehiculo</p>
        <RouterLink to="/vehiculos">Ver Vehiculos</RouterLink>
      </article>

      <section v-else class="reservas-list">
        <article v-for="reserva in reservas" :key="reserva.idReserva" class="reserva-card">
          <div>
            <small>{{ reserva.resNumeroPublico || `RES-${reserva.idReserva}` }}</small>
            <h3>{{ reserva.vehiculo?.nombreMarca }} {{ reserva.vehiculo?.modeloVehiculo }}</h3>
            <p>{{ formatearFecha(reserva.resFechaInicio) }} - {{ formatearFecha(reserva.resFechaFin) }}</p>
          </div>

          <div class="reserva-card__side">
            <span class="reserva-card__status">{{ formatReservationStatus(reserva.resEstado) }}</span>
            <strong>${{ Number(reserva.resTotal ?? 0).toFixed(2) }}</strong>
            <button
              v-if="esReservaPendiente(reserva)"
              type="button"
              class="reserva-card__action reserva-card__action--primary"
              @click="continuarReserva(reserva)"
            >
              <ArrowRight :size="16" />
              Continuar
            </button>
            <button
              v-if="puedeEditarReserva(reserva)"
              type="button"
              class="reserva-card__action"
              @click="abrirEditor(reserva)"
            >
              <Pencil :size="16" />
              Editar
            </button>
            <button
              v-if="esReservaPendiente(reserva)"
              type="button"
              class="reserva-card__action reserva-card__action--danger"
              @click="abrirCancelacion(reserva)"
            >
              <Trash2 :size="16" />
              Cancelar
            </button>
          </div>
        </article>
      </section>

      <div v-if="mostrarEditor && editandoReserva" class="modal-backdrop" @click.self="cerrarEditor">
        <article class="modal-card">
          <header class="modal-card__header">
            <div>
              <small>{{ editandoReserva.resNumeroPublico || `RES-${editandoReserva.idReserva}` }}</small>
              <h2>Editar Reserva Pendiente</h2>
            </div>
            <button type="button" class="modal-close" @click="cerrarEditor">
              <X :size="18" />
            </button>
          </header>

          <div class="modal-card__body">
            <div class="modal-grid">
              <label>
                <span>Fecha de inicio</span>
                <input v-model="editForm.resFechaInicio" type="date" />
              </label>
              <label>
                <span>Fecha de fin</span>
                <input v-model="editForm.resFechaFin" type="date" />
              </label>
            </div>

            <label class="modal-field">
              <span>Observacion</span>
              <textarea v-model="editForm.resObservacion" rows="4" placeholder="Agrega una nota para tu reserva" />
            </label>
          </div>

          <footer class="modal-card__footer">
            <button type="button" class="modal-secondary" @click="cerrarEditor">Cancelar</button>
            <button type="button" class="modal-primary" :disabled="guardando" @click="guardarEdicion">
              {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </footer>
        </article>
      </div>

      <div v-if="mostrarCancelacion && cancelandoReserva" class="modal-backdrop" @click.self="cerrarCancelacion">
        <article class="modal-card">
          <header class="modal-card__header">
            <div>
              <small>{{ cancelandoReserva.resNumeroPublico || `RES-${cancelandoReserva.idReserva}` }}</small>
              <h2>Cancelar Reserva Pendiente</h2>
            </div>
            <button type="button" class="modal-close" @click="cerrarCancelacion">
              <X :size="18" />
            </button>
          </header>

          <div class="modal-card__body">
            <div class="confirm-grid">
              <div>
                <span>Vehiculo</span>
                <strong>{{ cancelandoReserva.vehiculo?.nombreMarca }} {{ cancelandoReserva.vehiculo?.modeloVehiculo }}</strong>
              </div>
              <div>
                <span>Estado</span>
                <strong>{{ formatReservationStatus(cancelandoReserva.resEstado) }}</strong>
              </div>
              <div>
                <span>Fecha de inicio</span>
                <strong>{{ formatearFecha(cancelandoReserva.resFechaInicio) }}</strong>
              </div>
              <div>
                <span>Fecha de fin</span>
                <strong>{{ formatearFecha(cancelandoReserva.resFechaFin) }}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>${{ Number(cancelandoReserva.resTotal ?? 0).toFixed(2) }}</strong>
              </div>
              <div>
                <span>Observacion</span>
                <strong>{{ cancelandoReserva.resObservacion || 'Sin observacion' }}</strong>
              </div>
            </div>
            <p class="confirm-note">
              Esta accion cancelara la reserva pendiente. Si deseas confirmarla, usa el boton Continuar.
            </p>
          </div>

          <footer class="modal-card__footer">
            <button type="button" class="modal-secondary" @click="cerrarCancelacion">Volver</button>
            <button type="button" class="modal-primary modal-primary--danger" :disabled="guardando" @click="cancelarReservaPendiente">
              {{ guardando ? 'Cancelando...' : 'Cancelar reserva' }}
            </button>
          </footer>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reservas-view {
  background: linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%);
}

.reservas-hero {
  background: linear-gradient(120deg, #4d0d24, #6a1230 55%, #4a0b22 100%);
  color: #fff;
  padding: 2.5rem 0 3.4rem;
}

.reservas-hero__inner,
.reservas-view__inner {
  width: min(100%, 1520px);
  margin: 0 auto;
  padding: 0 1.25rem;
}

.reservas-hero h1 {
  margin: 0;
  font-size: clamp(2.8rem, 5vw, 4.2rem);
}

.reservas-hero p {
  margin: 0.8rem 0 0;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.82);
}

.reservas-view__inner {
  padding-top: 2.2rem;
  padding-bottom: 3rem;
}

.empty-state,
.feedback {
  width: min(100%, 1220px);
  margin: 0 auto;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1.7rem;
  box-shadow: var(--shadow-sm);
}

.empty-state {
  min-height: 380px;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 2rem;
}

.empty-state svg {
  color: var(--color-text-muted);
}

.empty-state h2 {
  margin: 0;
  font-size: 2rem;
}

.empty-state p {
  margin: 0.6rem 0 1.4rem;
  color: var(--color-text-muted);
  font-size: 1.15rem;
}

.empty-state a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  height: 3.7rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #7b173b, #571027);
  color: #fff;
  text-decoration: none;
  font-weight: 700;
}

.reservas-list {
  width: min(100%, 1220px);
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.reserva-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 1.4rem;
  border: 1px solid var(--color-border);
  background: #fff;
}

.reserva-card small {
  color: var(--color-primary);
  font-weight: 700;
}

.reserva-card h3 {
  margin: 0.4rem 0;
  font-size: 1.55rem;
}

.reserva-card p {
  margin: 0;
  color: var(--color-text-muted);
}

.reserva-card__side {
  text-align: right;
  display: grid;
  gap: 0.7rem;
  justify-items: end;
}

.reserva-card__status {
  display: inline-flex;
  justify-content: center;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: #fce7f3;
  color: var(--color-primary);
  font-weight: 700;
}

.reserva-card__side strong {
  font-size: 1.8rem;
}

.reserva-card__action {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.75rem;
  padding: 0 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 0.9rem;
  background: #fff;
  color: var(--color-primary);
  font-weight: 700;
  cursor: pointer;
}

.reserva-card__action--primary {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #7b173b, #571027);
}

.reserva-card__action--danger {
  color: #b42318;
  border-color: rgba(180, 35, 24, 0.22);
}

.feedback {
  padding: 1rem;
  text-align: center;
}

.feedback--error {
  color: #b42318;
}

.feedback--success {
  color: #166534;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
}

.modal-card {
  width: min(100%, 760px);
  border-radius: 1.5rem;
  background: #fff;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-card__header,
.modal-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.4rem;
}

.modal-card__header {
  border-bottom: 1px solid var(--color-border);
}

.modal-card__header small {
  color: var(--color-primary);
  font-weight: 700;
}

.modal-card__header h2 {
  margin: 0.35rem 0 0;
  font-size: 1.6rem;
}

.modal-card__body {
  padding: 1.4rem;
  display: grid;
  gap: 1rem;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.modal-grid label,
.modal-field {
  display: grid;
  gap: 0.45rem;
}

.modal-grid span,
.modal-field span {
  font-size: 0.9rem;
  font-weight: 700;
}

.modal-grid input,
.modal-field textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 0.9rem;
  padding: 0.9rem 1rem;
  font: inherit;
}

.confirm-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.confirm-grid div {
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
  border-radius: 1rem;
  background: #f7f7f8;
}

.confirm-grid span {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.confirm-grid strong {
  font-size: 1rem;
}

.confirm-note {
  margin: 0;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: #eef4ff;
  color: #214ea3;
  font-size: 0.95rem;
}

.modal-close,
.modal-secondary,
.modal-primary {
  border-radius: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

.modal-close {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--color-border);
  background: #fff;
}

.modal-card__footer {
  border-top: 1px solid var(--color-border);
  justify-content: end;
}

.modal-secondary,
.modal-primary {
  min-height: 3.1rem;
  padding: 0 1rem;
}

.modal-secondary {
  border: 1px solid var(--color-border);
  background: #fff;
}

.modal-primary {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #7b173b, #571027);
}

.modal-primary--danger {
  background: linear-gradient(135deg, #b42318, #7f1d1d);
}

@media (max-width: 720px) {
  .modal-grid,
  .confirm-grid,
  .reserva-card {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
