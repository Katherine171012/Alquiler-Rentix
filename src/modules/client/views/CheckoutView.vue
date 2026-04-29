<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Download,
  FileText,
  MapPin,
  UserRound,
} from 'lucide-vue-next'
import { crearConductor } from '../../../api/conductores.api'
import { obtenerLocalizacion } from '../../../api/localizaciones.api'
import { asignarConductorReserva } from '../../../api/reservasConductor.api'
import { agregarExtraReserva } from '../../../api/reservasExtra.api'
import { ROLES } from '../../../core/constants/roles'
import { useAuthStore } from '../../../stores/auth.store'
import { useReservaStore } from '../../../stores/reserva.store'
import { construirUrlImagenVehiculo } from '../../../utils/imagenesVehiculo'
import {
  confirmClientReservation,
  createClientReservation,
  getInvoiceByReservation,
  getReservationDetail,
  resolveCurrentClient,
} from '../services/clientPortal.service'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const reservaStore = useReservaStore()

const cargando = ref(false)
const error = ref('')
const localizacionRecogida = ref(null)
const localizacionEntrega = ref(null)
const reservaPendiente = ref(null)

const esExito = computed(() => route.name === 'reserva-confirmacion' && route.query.estado === 'exito')
const reservaPendienteId = computed(() => Number(route.query.reservaId || 0) || null)
const estaRetomandoPendiente = computed(() => !esExito.value && Boolean(reservaPendienteId.value))
const diasReserva = computed(() => reservaStore.diasReserva)
const subtotalVehiculo = computed(() => reservaStore.subtotalVehiculo)
const subtotalExtras = computed(() =>
  reservaStore.extras.reduce((total, extra) => total + Number(extra.valor ?? 0) * Math.max(diasReserva.value, 1), 0),
)
const subtotal = computed(() => subtotalVehiculo.value + subtotalExtras.value)
const impuestos = computed(() => subtotal.value * 0.16)
const total = computed(() => subtotal.value + impuestos.value)

function formatearFecha(valor) {
  if (!valor) return 'No especificado'
  const date = new Date(valor)
  return new Intl.DateTimeFormat('es-EC', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

async function cargarLocalizacionesSeleccionadas() {
  try {
    if (reservaPendiente.value?.localizacionRecogida) {
      localizacionRecogida.value = reservaPendiente.value.localizacionRecogida
    }
    if (reservaPendiente.value?.localizacionEntrega) {
      localizacionEntrega.value = reservaPendiente.value.localizacionEntrega
    }

    const [recogida, entrega] = await Promise.all([
      reservaStore.idLocalizacionRecogida ? obtenerLocalizacion(reservaStore.idLocalizacionRecogida) : Promise.resolve(null),
      reservaStore.idLocalizacionEntrega ? obtenerLocalizacion(reservaStore.idLocalizacionEntrega) : Promise.resolve(null),
    ])

    localizacionRecogida.value = recogida?.data ?? localizacionRecogida.value
    localizacionEntrega.value = entrega?.data ?? localizacionEntrega.value
  } catch {
    localizacionRecogida.value = null
    localizacionEntrega.value = null
  }
}

function nombreLocalizacion(item, fallbackId) {
  return (
    item?.nombreLocalizacion ||
    item?.nombre ||
    item?.direccionLocalizacion ||
    (fallbackId ? `Localizacion #${fallbackId}` : 'No especificado')
  )
}

async function persistirConductoresYExtras(idReserva) {
  if (!authStore.hasAnyRole([ROLES.ADMIN, ROLES.VENDEDOR])) {
    return
  }

  for (const conductor of reservaStore.conductores) {
    const conductorCreado = await crearConductor({
      tipoIdentificacion: conductor.tipoIdentificacion,
      numeroIdentificacion: conductor.numeroIdentificacion,
      conNombre1: conductor.conNombre1,
      conNombre2: conductor.conNombre2 || null,
      conApellido1: conductor.conApellido1,
      conApellido2: conductor.conApellido2 || null,
      numeroLicencia: conductor.numeroLicencia,
      fechaVencimientoLicencia: conductor.fechaVencimientoLicencia,
      edadConductor: Number(conductor.edadConductor || 18),
      conTelefono: conductor.telefono || null,
      conCorreo: conductor.correo || null,
      creadoPorUsuario: authStore.user?.username ?? authStore.user?.correo ?? 'cliente-web',
      origenRegistro: 'ECOMMERCE',
    })

    const idConductor = conductorCreado?.data?.idConductor ?? conductorCreado?.idConductor

    if (idConductor) {
      await asignarConductorReserva({
        rxcIdReserva: Number(idReserva),
        rxcIdConductor: Number(idConductor),
        rxcEsPrincipal: Boolean(conductor.principal),
      })
    }
  }

  for (const extra of reservaStore.extras) {
    await agregarExtraReserva({
      rxeIdReserva: Number(idReserva),
      rxeIdExtra: Number(extra.idExtra),
      rxeCantidad: Number(extra.cantidad ?? 1),
      rxePrecioPorDia: Number(extra.valor ?? 0),
    })
  }
}

async function confirmarYCrearReserva() {
  try {
    cargando.value = true
    error.value = ''

    if (estaRetomandoPendiente.value) {
      const reservaId = reservaPendienteId.value
      const confirmacion = await confirmClientReservation(reservaId)
      const reservaDetalle = (await getReservationDetail(reservaId)) ?? reservaPendiente.value
      const factura =
        (confirmacion?.idFactura && { idFactura: confirmacion.idFactura, facNumero: confirmacion.numeroFactura }) ??
        (await getInvoiceByReservation(reservaId))

      reservaStore.setReservaResultado({
        reserva: reservaDetalle,
        factura,
      })

      await router.push({
        path: '/reserva/confirmacion',
        query: {
          estado: 'exito',
          idReserva: reservaId,
          idFactura: factura?.idFactura ?? '',
        },
      })
      return
    }

    const client = await resolveCurrentClient(authStore.user)

    if (!client?.idCliente) {
      error.value = 'No se pudo identificar el cliente autenticado.'
      return
    }

    const reservaCreada = await createClientReservation({
      resIdCliente: client.idCliente,
      resIdVehiculo: reservaStore.idVehiculo,
      resFechaInicio: reservaStore.fechaInicio,
      resFechaFin: reservaStore.fechaFin,
      resPrecioPorDia: Number(reservaStore.vehiculo?.precioBaseDia ?? 0),
      resObservacion: 'Reserva creada desde portal cliente',
      resCreadoPorUsuario: authStore.user?.username ?? authStore.user?.correo ?? 'cliente-web',
    })

    const reservaId = reservaCreada?.idReserva

    if (!reservaId) {
      error.value = 'La reserva no devolvio un identificador valido.'
      return
    }

    await persistirConductoresYExtras(reservaId)

    const confirmacion = await confirmClientReservation(reservaId)
    const reservaDetalle = (await getReservationDetail(reservaId)) ?? reservaCreada
    const factura =
      (confirmacion?.idFactura && { idFactura: confirmacion.idFactura, facNumero: confirmacion.numeroFactura }) ??
      (await getInvoiceByReservation(reservaId))

    reservaStore.setReservaResultado({
      reserva: reservaDetalle,
      factura,
    })

    await router.push({
      path: '/reserva/confirmacion',
      query: {
        estado: 'exito',
        idReserva: reservaId,
        idFactura: factura?.idFactura ?? '',
      },
    })
  } catch (err) {
    error.value = err?.message ?? 'No se pudo confirmar la reserva.'
  } finally {
    cargando.value = false
  }
}

async function cargarReservaPendienteSiHaceFalta() {
  if (!estaRetomandoPendiente.value) return

  try {
    cargando.value = true
    error.value = ''
    const detalle = await getReservationDetail(reservaPendienteId.value)
    reservaPendiente.value = detalle ?? null
    if (!detalle) {
      error.value = 'No se pudo cargar la reserva pendiente.'
      return
    }

    reservaStore.hydrateFromReservation(detalle)
    reservaStore.setConductores([])
    reservaStore.setExtras([])
    await cargarLocalizacionesSeleccionadas()
  } catch (err) {
    error.value = err?.message ?? 'No se pudo cargar la reserva pendiente.'
  } finally {
    cargando.value = false
  }
}

async function cargarResultadoSiHaceFalta() {
  if (!esExito.value) return
  if (reservaStore.reservaConfirmada) return

  const reservaId = Number(route.query.idReserva)
  if (!reservaId) return

  try {
    cargando.value = true
    reservaStore.setReservaResultado({
      reserva: await getReservationDetail(reservaId),
      factura: await getInvoiceByReservation(reservaId),
    })
  } catch (err) {
    error.value = err?.message ?? 'No se pudo cargar el detalle de la reserva confirmada.'
  } finally {
    cargando.value = false
  }
}

function volverPasoAnterior() {
  if (estaRetomandoPendiente.value) {
    router.push('/mi-cuenta/reservas')
    return
  }
  router.push('/reserva/conductor')
}

onMounted(cargarReservaPendienteSiHaceFalta)
onMounted(cargarResultadoSiHaceFalta)
onMounted(cargarLocalizacionesSeleccionadas)
</script>

<template>
  <section class="checkout-view">
    <div class="checkout-view__inner">
      <template v-if="!esExito">
        <nav class="checkout-breadcrumb">
          <RouterLink to="/vehiculos">Vehiculos</RouterLink>
          <span>/</span>
          <span>{{ reservaStore.vehiculo?.nombreMarca }} {{ reservaStore.vehiculo?.modeloVehiculo }}</span>
          <span>/</span>
          <span>Confirmacion</span>
        </nav>

        <header class="checkout-header">
          <h1>{{ estaRetomandoPendiente ? 'Continuar Reserva Pendiente' : 'Confirmar Reserva' }}</h1>
          <p>
            {{
              estaRetomandoPendiente
                ? 'Retoma tu reserva pendiente y confirma para generar la factura.'
                : 'Paso 4 de 4: Revisa y confirma tu reserva'
            }}
          </p>
        </header>

        <p v-if="error" class="feedback feedback--error">{{ error }}</p>

        <div class="checkout-layout">
          <section class="checkout-main">
            <article class="checkout-card">
              <h2>
                <Check :size="22" />
                Vehiculo Seleccionado
              </h2>
              <div class="vehicle-card">
                <img
                  v-if="reservaStore.vehiculo"
                  :src="construirUrlImagenVehiculo(reservaStore.vehiculo.imagenVehiculo)"
                  :alt="`${reservaStore.vehiculo.nombreMarca} ${reservaStore.vehiculo.modeloVehiculo}`"
                />
                <div>
                  <h3>{{ reservaStore.vehiculo?.nombreMarca }} {{ reservaStore.vehiculo?.modeloVehiculo }}</h3>
                  <p>{{ reservaStore.vehiculo?.nombreCategoria }}</p>
                  <strong>
                    ${{ Number(reservaStore.vehiculo?.precioBaseDia ?? 0).toFixed(0) }}/dia × {{ diasReserva }} dias =
                    ${{ subtotalVehiculo.toFixed(0) }}
                  </strong>
                </div>
              </div>
            </article>

            <article class="checkout-card">
              <h2>
                <CalendarDays :size="22" />
                Fechas y Ubicacion
              </h2>
              <div class="detail-grid">
                <div>
                  <small>Fecha de Inicio</small>
                  <strong>{{ formatearFecha(reservaStore.fechaInicio) }}</strong>
                </div>
                <div>
                  <small>Fecha de Fin</small>
                  <strong>{{ formatearFecha(reservaStore.fechaFin) }}</strong>
                </div>
                <div>
                  <small>Lugar de Recogida</small>
                  <strong>{{ nombreLocalizacion(localizacionRecogida, reservaStore.idLocalizacionRecogida) }}</strong>
                </div>
                <div>
                  <small>Lugar de Entrega</small>
                  <strong>{{ nombreLocalizacion(localizacionEntrega, reservaStore.idLocalizacionEntrega) }}</strong>
                </div>
              </div>
            </article>

            <article class="checkout-card">
              <h2>
                <UserRound :size="22" />
                Conductores Autorizados
              </h2>

              <div v-if="reservaStore.conductores.length" class="drivers-list">
                <article
                  v-for="conductor in reservaStore.conductores"
                  :key="conductor.id"
                  class="driver-card"
                >
                  <div>
                    <strong>{{ conductor.nombreCompleto }}</strong>
                    <span>Licencia: {{ conductor.numeroLicencia }}</span>
                    <span>{{ conductor.tipoIdentificacion }}: {{ conductor.numeroIdentificacion }}</span>
                  </div>
                  <span v-if="conductor.principal" class="driver-card__badge">Principal</span>
                </article>
              </div>
              <p v-else class="empty-note">No agregaste conductores adicionales para esta reserva.</p>
            </article>

            <footer class="checkout-actions">
              <button type="button" class="btn-secondary" @click="volverPasoAnterior">
                <ArrowLeft :size="18" />
                Volver
              </button>
              <button type="button" class="btn-primary" :disabled="cargando" @click="confirmarYCrearReserva">
                <Check :size="18" />
                {{
                  cargando
                    ? 'Confirmando...'
                    : (estaRetomandoPendiente ? 'Confirmar reserva pendiente' : 'Confirmar y Pagar')
                }}
              </button>
            </footer>
          </section>

          <aside class="checkout-summary">
            <h2>
              <FileText :size="22" />
              Resumen de Pago
            </h2>
            <div class="summary-row">
              <span>Vehiculo ({{ diasReserva }} dias)</span>
              <strong>${{ subtotalVehiculo.toFixed(2) }}</strong>
            </div>
            <div class="summary-row" v-if="subtotalExtras > 0">
              <span>Extras</span>
              <strong>${{ subtotalExtras.toFixed(2) }}</strong>
            </div>
            <div class="summary-row">
              <span>Subtotal</span>
              <strong>${{ subtotal.toFixed(2) }}</strong>
            </div>
            <div class="summary-row">
              <span>Impuestos (16%)</span>
              <strong>${{ impuestos.toFixed(2) }}</strong>
            </div>
            <div class="summary-row summary-row--total">
              <span>Total</span>
              <strong>${{ total.toFixed(2) }}</strong>
            </div>

            <div class="payment-method">
              <h3>
                <FileText :size="20" />
                Metodo de Pago
              </h3>
              <div>Tarjeta de Credito/Debito</div>
              <p>Pago seguro procesado al confirmar.</p>
            </div>
          </aside>
        </div>
      </template>

      <template v-else>
        <div class="success-hero">
          <span class="success-hero__icon"><Check :size="48" /></span>
          <h1>Reserva Confirmada!</h1>
          <p>Tu reserva ha sido procesada exitosamente</p>
        </div>

        <p v-if="error" class="feedback feedback--error">{{ error }}</p>

        <article class="success-card">
          <header class="success-card__head">
            <div>
              <small>Numero de Reserva</small>
              <strong>{{ reservaStore.reservaConfirmada?.resNumeroPublico || `#${reservaStore.reservaConfirmada?.idReserva || route.query.idReserva}` }}</strong>
            </div>
            <div class="success-card__invoice">
              <small>Factura</small>
              <strong>{{ reservaStore.facturaGenerada?.facNumero || 'Pendiente' }}</strong>
            </div>
          </header>

          <section class="success-section">
            <h2>Vehiculo Reservado</h2>
            <div class="vehicle-card">
              <img
                v-if="reservaStore.vehiculo"
                :src="construirUrlImagenVehiculo(reservaStore.vehiculo.imagenVehiculo)"
                :alt="`${reservaStore.vehiculo.nombreMarca} ${reservaStore.vehiculo.modeloVehiculo}`"
              />
              <div>
                <h3>{{ reservaStore.vehiculo?.nombreMarca }} {{ reservaStore.vehiculo?.modeloVehiculo }}</h3>
                <p>{{ reservaStore.vehiculo?.nombreCategoria }}</p>
                <strong>${{ Number(reservaStore.vehiculo?.precioBaseDia ?? 0).toFixed(0) }}/dia × {{ diasReserva }} dias</strong>
              </div>
            </div>
          </section>

          <section class="success-section">
            <h2>Fechas y Ubicacion</h2>
            <div class="detail-grid">
              <div>
                <small>Fecha de Recogida</small>
                <strong>{{ formatearFecha(reservaStore.fechaInicio) }}</strong>
              </div>
              <div>
                <small>Fecha de Devolucion</small>
                <strong>{{ formatearFecha(reservaStore.fechaFin) }}</strong>
              </div>
              <div>
                <small>Lugar de Recogida</small>
                <strong>{{ nombreLocalizacion(localizacionRecogida, reservaStore.idLocalizacionRecogida) }}</strong>
              </div>
              <div>
                <small>Lugar de Entrega</small>
                <strong>{{ nombreLocalizacion(localizacionEntrega, reservaStore.idLocalizacionEntrega) }}</strong>
              </div>
            </div>
          </section>

          <section class="success-section" v-if="reservaStore.conductores.length">
            <h2>Conductor Principal</h2>
            <article class="driver-card">
              <div>
                <strong>{{ reservaStore.conductores[0]?.nombreCompleto }}</strong>
                <span>Licencia: {{ reservaStore.conductores[0]?.numeroLicencia }}</span>
                <span v-if="reservaStore.conductores[0]?.telefono">Tel: {{ reservaStore.conductores[0]?.telefono }}</span>
              </div>
            </article>
          </section>

          <section class="success-section">
            <h2>Resumen de Pago</h2>
            <div class="summary-row">
              <span>Subtotal</span>
              <strong>${{ subtotal.toFixed(2) }}</strong>
            </div>
            <div class="summary-row">
              <span>Impuestos</span>
              <strong>${{ impuestos.toFixed(2) }}</strong>
            </div>
            <div class="summary-row summary-row--total">
              <span>Total Pagado</span>
              <strong>${{ total.toFixed(2) }}</strong>
            </div>
          </section>
        </article>

        <article class="next-steps">
          <h2>Que sigue?</h2>
          <div class="next-steps__list">
            <div class="step-card step-card--blue">
              <b>1</b>
              <div>
                <strong>Confirmacion por Email</strong>
                <span>Recibiras un correo con todos los detalles de tu reserva y factura.</span>
              </div>
            </div>
            <div class="step-card step-card--green">
              <b>2</b>
              <div>
                <strong>Recoge tu Vehiculo</strong>
                <span>Presenta tu confirmacion y documentos en la localizacion elegida.</span>
              </div>
            </div>
            <div class="step-card step-card--violet">
              <b>3</b>
              <div>
                <strong>Disfruta tu Viaje</strong>
                <span>Conduce con seguridad y devuelve el vehiculo en la fecha acordada.</span>
              </div>
            </div>
          </div>
        </article>

        <footer class="success-actions">
          <button type="button" class="btn-secondary btn-secondary--download">
            <Download :size="18" />
            Descargar Factura
          </button>
          <RouterLink to="/mi-cuenta/reservas" class="btn-primary btn-primary--link">
            Ver Mis Reservas
            <ArrowRight :size="18" />
          </RouterLink>
        </footer>

        <RouterLink to="/" class="success-home-link">Volver al Inicio</RouterLink>
      </template>
    </div>
  </section>
</template>

<style scoped>
.checkout-view {
  padding: 2rem 1rem 4rem;
  background:
    linear-gradient(180deg, #f4fff8 0%, #ffffff 22%),
    linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%);
}

.checkout-view__inner {
  width: min(100%, 1120px);
  margin: 0 auto;
}

.checkout-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  color: var(--color-text-muted);
}

.checkout-breadcrumb a {
  color: inherit;
  text-decoration: none;
}

.checkout-header,
.success-hero {
  margin: 2rem 0 1.8rem;
}

.checkout-header h1,
.success-hero h1 {
  margin: 0;
  font-size: clamp(2.4rem, 4vw, 3.5rem);
  letter-spacing: -0.04em;
}

.checkout-header p,
.success-hero p {
  margin: 0.75rem 0 0;
  color: var(--color-text-muted);
  font-size: 1.15rem;
}

.checkout-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 2rem;
  align-items: start;
}

.checkout-main {
  display: grid;
  gap: 1.3rem;
}

.checkout-card,
.checkout-summary,
.success-card,
.next-steps,
.feedback {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1.6rem;
}

.checkout-card,
.checkout-summary {
  padding: 1.8rem;
}

.checkout-card h2,
.checkout-summary h2,
.success-section h2,
.next-steps h2 {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0 0 1.2rem;
  font-size: 1.2rem;
}

.checkout-card h2 svg,
.checkout-summary h2 svg,
.success-section h2 svg {
  color: var(--color-primary);
}

.vehicle-card {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.vehicle-card img {
  width: 160px;
  height: 118px;
  object-fit: cover;
  border-radius: 1rem;
}

.vehicle-card h3 {
  margin: 0;
  font-size: 1.9rem;
}

.vehicle-card p {
  margin: 0.4rem 0 0.7rem;
  color: var(--color-text-muted);
}

.vehicle-card strong {
  color: var(--color-primary);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}

.detail-grid small,
.detail-grid strong {
  display: block;
}

.detail-grid small {
  margin-bottom: 0.35rem;
  color: var(--color-text-muted);
}

.drivers-list {
  display: grid;
  gap: 1rem;
}

.driver-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: #f7f7f8;
}

.driver-card strong,
.driver-card span {
  display: block;
}

.driver-card span {
  margin-top: 0.25rem;
  color: var(--color-text-muted);
}

.driver-card__badge {
  align-self: start;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  color: #fff !important;
  background: linear-gradient(135deg, #7b173b, #571027);
}

.empty-note {
  margin: 0;
  color: var(--color-text-muted);
}

.checkout-actions,
.success-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.btn-primary,
.btn-secondary,
.btn-primary--link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 3.7rem;
  padding: 0 1.3rem;
  border-radius: 1rem;
  font-weight: 700;
  text-decoration: none;
}

.btn-primary,
.btn-primary--link {
  border: none;
  background: linear-gradient(135deg, #7b173b, #571027);
  color: #fff;
}

.btn-secondary {
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
}

.checkout-summary .summary-row,
.success-section .summary-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 0;
  border-top: 1px solid var(--color-border);
}

.summary-row--total strong {
  font-size: 1.8rem;
  color: var(--color-primary);
}

.payment-method {
  margin-top: 1.4rem;
  padding-top: 1.4rem;
  border-top: 1px solid var(--color-border);
}

.payment-method h3 {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 0.8rem;
}

.payment-method div {
  padding: 1rem;
  border-radius: 1rem;
  background: #f7f7f8;
  font-weight: 700;
}

.payment-method p {
  margin: 1rem 0 0;
  padding: 1rem;
  border-radius: 1rem;
  background: #eaf2ff;
  color: #214ea3;
}

.success-hero {
  text-align: center;
}

.success-hero__icon {
  width: 92px;
  height: 92px;
  margin: 0 auto 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #dcfce7;
  color: #16a34a;
}

.success-card {
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.success-card__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
  color: #fff;
  background: linear-gradient(135deg, #6a1230, #4d0d24);
}

.success-card__head small,
.success-card__head strong {
  display: block;
}

.success-card__head small {
  color: rgba(255, 255, 255, 0.76);
}

.success-card__head strong {
  margin-top: 0.35rem;
  font-size: 1.9rem;
}

.success-card__invoice {
  text-align: right;
}

.success-section {
  padding: 1.6rem;
  border-top: 1px solid var(--color-border);
}

.next-steps {
  margin-top: 1.6rem;
  padding: 1.6rem;
}

.next-steps__list {
  display: grid;
  gap: 1rem;
}

.step-card {
  display: flex;
  gap: 1rem;
  align-items: start;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
}

.step-card b {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.step-card strong,
.step-card span {
  display: block;
}

.step-card span {
  margin-top: 0.25rem;
}

.step-card--blue {
  background: #eaf2ff;
  color: #214ea3;
}

.step-card--blue b {
  background: #2563eb;
}

.step-card--green {
  background: #eafaf0;
  color: #177245;
}

.step-card--green b {
  background: #16a34a;
}

.step-card--violet {
  background: #f3ebff;
  color: #7a2dd3;
}

.step-card--violet b {
  background: #9333ea;
}

.success-actions {
  margin-top: 1.6rem;
}

.btn-secondary--download,
.btn-primary--link {
  flex: 1;
}

.success-home-link {
  display: block;
  margin-top: 1.6rem;
  text-align: center;
  color: var(--color-primary);
  text-decoration: none;
}

.feedback {
  padding: 1rem;
  text-align: center;
}

.feedback--error {
  color: #b42318;
}

@media (max-width: 980px) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .detail-grid,
  .checkout-actions,
  .success-actions,
  .vehicle-card,
  .driver-card,
  .success-card__head {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .vehicle-card img {
    width: 100%;
    height: 220px;
  }
}
</style>
