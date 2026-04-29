<script setup>
import { computed, onMounted, ref } from 'vue'
import { CalendarDays, Download, Eye, FileText, X } from 'lucide-vue-next'
import { useAuthStore } from '../../../stores/auth.store'
import {
  formatInvoiceStatus,
  getInvoiceDetail,
  listClientInvoices,
  resolveCurrentClient,
} from '../services/clientPortal.service'

const authStore = useAuthStore()

const cargando = ref(true)
const error = ref('')
const facturas = ref([])
const facturaSeleccionada = ref(null)

const hayFacturas = computed(() => facturas.value.length > 0)

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha'
  const date = new Date(valor)
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

async function cargarFacturas() {
  try {
    cargando.value = true
    const client = await resolveCurrentClient(authStore.user)
    facturas.value = await listClientInvoices(client?.idCliente)
  } catch (err) {
    error.value = err?.message ?? 'No se pudieron cargar las facturas.'
  } finally {
    cargando.value = false
  }
}

async function verDetalle(factura) {
  facturaSeleccionada.value = (await getInvoiceDetail(factura?.idFactura)) ?? factura
}

function cerrarDetalle() {
  facturaSeleccionada.value = null
}

onMounted(cargarFacturas)
</script>

<template>
  <section class="facturas-view">
    <header class="facturas-hero">
      <div class="facturas-hero__inner">
        <h1>Mis Facturas</h1>
        <p>Consulta y descarga tus facturas</p>
      </div>
    </header>

    <div class="facturas-view__inner">
      <p v-if="cargando" class="feedback">Cargando facturas...</p>
      <p v-else-if="error" class="feedback feedback--error">{{ error }}</p>

      <article v-else-if="!hayFacturas" class="empty-state">
        <FileText :size="72" />
        <h2>No tienes facturas</h2>
        <p>Tus comprobantes apareceran aqui luego de confirmar una reserva.</p>
      </article>

      <section v-else class="facturas-table">
        <header>
          <span>Numero</span>
          <span>Fecha</span>
          <span>Concepto</span>
          <span>Total</span>
          <span>Estado</span>
          <span>Acciones</span>
        </header>

        <article v-for="factura in facturas" :key="factura.idFactura">
          <span class="factura-id">
            <FileText :size="18" />
            {{ factura.facNumero }}
          </span>
          <span class="factura-date">
            <CalendarDays :size="18" />
            {{ formatearFecha(factura.facFechaEmisionUtc) }}
          </span>
          <span class="factura-detail">
            Renta de Vehiculo
            <small>Reserva #{{ factura.facIdReserva }}</small>
          </span>
          <strong>${{ Number(factura.facTotal ?? 0).toFixed(2) }}</strong>
          <span class="factura-status">{{ formatInvoiceStatus(factura.facEstado) }}</span>
          <span class="factura-actions">
            <button type="button" @click="verDetalle(factura)">
              <Eye :size="18" />
            </button>
            <button type="button">
              <Download :size="18" />
            </button>
          </span>
        </article>
      </section>
    </div>

    <div v-if="facturaSeleccionada" class="factura-modal" @click.self="cerrarDetalle">
      <article class="factura-dialog">
        <header class="factura-dialog__header">
          <h2>Detalle de Factura</h2>
          <button type="button" @click="cerrarDetalle">
            <X :size="20" />
          </button>
        </header>

        <div class="factura-dialog__content">
          <section class="factura-highlight">
            <div>
              <small>Numero de Factura</small>
              <strong>{{ facturaSeleccionada.facNumero }}</strong>
            </div>
            <span>{{ formatInvoiceStatus(facturaSeleccionada.facEstado) }}</span>
            <div>
              <small>Fecha de Emision</small>
              <strong>{{ formatearFecha(facturaSeleccionada.facFechaEmisionUtc) }}</strong>
            </div>
            <div>
              <small>Reserva Asociada</small>
              <strong>#{{ facturaSeleccionada.facIdReserva }}</strong>
            </div>
          </section>

          <section class="factura-breakdown">
            <h3>Desglose de Pago</h3>
            <div>
              <span>Subtotal</span>
              <strong>${{ Number(facturaSeleccionada.facSubtotal ?? 0).toFixed(2) }}</strong>
            </div>
            <div>
              <span>Impuestos (16%)</span>
              <strong>${{ Number(facturaSeleccionada.facImpuesto ?? 0).toFixed(2) }}</strong>
            </div>
            <div class="factura-breakdown__total">
              <span>Total</span>
              <strong>${{ Number(facturaSeleccionada.facTotal ?? 0).toFixed(2) }}</strong>
            </div>
          </section>

          <section class="factura-method">
            <h3>Metodo de Pago</h3>
            <div>Tarjeta</div>
          </section>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.facturas-view {
  background: linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%);
}

.facturas-hero {
  background: linear-gradient(120deg, #4d0d24, #6a1230 55%, #4a0b22 100%);
  color: #fff;
  padding: 2.5rem 0 3.4rem;
}

.facturas-hero__inner,
.facturas-view__inner {
  width: min(100%, 1520px);
  margin: 0 auto;
  padding: 0 1.25rem;
}

.facturas-hero h1 {
  margin: 0;
  font-size: clamp(2.8rem, 5vw, 4.2rem);
}

.facturas-hero p {
  margin: 0.8rem 0 0;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.82);
}

.facturas-view__inner {
  padding-top: 2.2rem;
  padding-bottom: 3rem;
}

.facturas-table,
.feedback,
.empty-state {
  width: min(100%, 1220px);
  margin: 0 auto;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1.7rem;
  box-shadow: var(--shadow-sm);
}

.facturas-table header,
.facturas-table article {
  display: grid;
  grid-template-columns: 1.2fr 1.1fr 1.4fr 0.8fr 0.8fr 0.7fr;
  align-items: center;
  gap: 1rem;
  padding: 1.4rem 1.6rem;
}

.facturas-table header {
  font-weight: 700;
  border-bottom: 1px solid var(--color-border);
}

.facturas-table article + article {
  border-top: 1px solid var(--color-border);
}

.factura-id,
.factura-date,
.factura-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.factura-id {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
}

.factura-detail {
  display: grid;
  gap: 0.3rem;
}

.factura-detail small {
  color: var(--color-text-muted);
}

.factura-status {
  display: inline-flex;
  justify-content: center;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  font-weight: 700;
}

.factura-actions button {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  color: var(--color-primary);
}

.feedback,
.empty-state {
  padding: 1rem;
  text-align: center;
}

.empty-state {
  min-height: 320px;
  display: grid;
  place-items: center;
}

.empty-state p {
  color: var(--color-text-muted);
}

.feedback--error {
  color: #b42318;
}

.factura-modal {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.5);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 60;
}

.factura-dialog {
  width: min(100%, 840px);
  max-height: 88vh;
  overflow: auto;
  background: #fff;
  border-radius: 1.7rem;
  box-shadow: var(--shadow-lg);
}

.factura-dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.8rem;
  border-bottom: 1px solid var(--color-border);
}

.factura-dialog__header h2 {
  margin: 0;
}

.factura-dialog__header button {
  border: none;
  background: transparent;
  cursor: pointer;
}

.factura-dialog__content {
  padding: 1.8rem;
  display: grid;
  gap: 1.6rem;
}

.factura-highlight,
.factura-method div {
  padding: 1.4rem;
  border-radius: 1.2rem;
  background: #f8f2f5;
  border: 1px solid #ead2dc;
}

.factura-highlight {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.2rem;
}

.factura-highlight small,
.factura-highlight strong {
  display: block;
}

.factura-highlight small {
  margin-bottom: 0.4rem;
  color: var(--color-text-muted);
}

.factura-highlight strong {
  font-size: 1.1rem;
}

.factura-highlight > span {
  align-self: start;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  font-weight: 700;
}

.factura-breakdown h3,
.factura-method h3 {
  margin: 0 0 1rem;
  font-size: 1.6rem;
}

.factura-breakdown div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}

.factura-breakdown__total {
  padding: 1rem 1.2rem !important;
  border-radius: 1rem;
  background: #f7f3f4;
  border-bottom: none !important;
}

@media (max-width: 980px) {
  .facturas-table {
    overflow: auto;
  }

  .facturas-table header,
  .facturas-table article {
    min-width: 900px;
  }

  .factura-highlight {
    grid-template-columns: 1fr;
  }
}
</style>
