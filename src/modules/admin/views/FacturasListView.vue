<script setup>
import { computed, onMounted, ref } from 'vue'
import { Download, Eye, FilePlus2, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '../../../stores/auth.store'
import { listarClientes } from '../../../api/clientes.api'
import { descargarImpresionFactura, obtenerFactura, consultarFacturas, generarFactura, anularFactura } from '../../../api/facturas.api'
import { consultarReservas, obtenerReserva } from '../../../api/reservas.api'
import { AdminEmptyState, AdminModal, AdminPageHeader, AdminSearchBar, AdminStatusBadge } from '../components'
import { clienteNombre, formatCurrency, formatDate, getItems, invoiceStateMeta } from '../utils/panel'

const authStore = useAuthStore()
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchTerm = ref('')
const facturas = ref([])
const reservas = ref([])
const clientes = ref([])
const selectedFactura = ref(null)
const activeModal = ref('')
const form = ref(createFacturaForm())

function createFacturaForm() {
  return {
    facIdReserva: '',
    facIdCliente: '',
    facNumero: '',
    facSubtotal: 0,
    facImpuesto: 0,
    facTotal: 0,
    facEstado: 'EMI',
  }
}

const filteredFacturas = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return facturas.value

  return facturas.value.filter((factura) => {
    const haystack = [
      factura.facNumero,
      factura.facIdReserva,
      factura.facIdCliente,
      invoiceStateMeta(factura.facEstado).label,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  })
})

const clienteMap = computed(() => Object.fromEntries(clientes.value.map((cliente) => [cliente.idCliente, clienteNombre(cliente)])))

const reservaOptions = computed(() =>
  reservas.value.map((reserva) => ({
    id: reserva.idReserva,
    label: `${reserva.resNumeroPublico || `#${reserva.idReserva}`} · ${reserva.vehiculo?.modeloVehiculo || 'Vehiculo'} · ${clienteNombre(reserva.cliente, reserva.resIdCliente)}`,
  })),
)

function resetMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

async function loadFacturas() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [facturasResponse, reservasResponse, clientesResponse] = await Promise.all([
      consultarFacturas({ pageNumber: 1, pageSize: 200 }),
      consultarReservas({ pageNumber: 1, pageSize: 200 }),
      listarClientes(),
    ])

    facturas.value = getItems(facturasResponse.data)
    reservas.value = getItems(reservasResponse.data)
    clientes.value = getItems(clientesResponse.data)
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudieron cargar las facturas.'
  } finally {
    isLoading.value = false
  }
}

async function hydrateFacturaForm() {
  if (!form.value.facIdReserva) return

  try {
    const response = await obtenerReserva(form.value.facIdReserva)
    const reserva = response.data
    form.value.facIdCliente = reserva.resIdCliente
    form.value.facSubtotal = reserva.resSubtotal ?? reserva.resTotal ?? 0
    form.value.facImpuesto = Number((Number(form.value.facSubtotal) * 0.15).toFixed(2))
    form.value.facTotal = Number(form.value.facSubtotal) + Number(form.value.facImpuesto)
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo cargar la reserva seleccionada.'
  }
}

async function openDetail(idFactura) {
  try {
    const response = await obtenerFactura(idFactura)
    selectedFactura.value = response.data
    activeModal.value = 'detail'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo obtener la factura.'
  }
}

function closeModal() {
  activeModal.value = ''
  selectedFactura.value = null
  form.value = createFacturaForm()
}

async function submitFactura() {
  isSubmitting.value = true
  resetMessages()
  try {
    await generarFactura({
      facIdReserva: Number(form.value.facIdReserva),
      facIdCliente: Number(form.value.facIdCliente),
      facNumero: form.value.facNumero,
      facSubtotal: Number(form.value.facSubtotal),
      facImpuesto: Number(form.value.facImpuesto),
      facTotal: Number(form.value.facTotal),
      facEstado: form.value.facEstado,
      facCreadoPorUsuario: authStore.user?.username ?? 'admin',
    })

    successMessage.value = 'Factura generada correctamente.'
    closeModal()
    await loadFacturas()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo generar la factura.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleAnular(idFactura) {
  resetMessages()
  try {
    await anularFactura(idFactura)
    successMessage.value = 'Factura anulada correctamente.'
    await loadFacturas()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo anular la factura.'
  }
}

async function handleDownload(idFactura, numeroFactura) {
  resetMessages()
  try {
    const response = await descargarImpresionFactura(idFactura)
    const blob = response.data
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${numeroFactura || `factura-${idFactura}`}.pdf`
    anchor.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    errorMessage.value =
      error?.message ??
      'No se pudo descargar la factura. Si el backend aun no retorna archivo binario, revisar ese endpoint.'
  }
}

onMounted(loadFacturas)
</script>

<template>
  <section class="admin-page">
    <AdminPageHeader title="Facturas" description="Gestion de facturacion y documentos emitidos">
      <button type="button" class="admin-button" @click="activeModal = 'form'">
        <FilePlus2 :size="18" />
        <span>Nueva Factura</span>
      </button>
    </AdminPageHeader>

    <p v-if="errorMessage" class="admin-state-message admin-state-message--error">{{ errorMessage }}</p>
    <p v-else-if="successMessage" class="admin-state-message admin-state-message--success">{{ successMessage }}</p>

    <div class="admin-card">
      <div class="admin-card__section">
        <AdminSearchBar v-model="searchTerm" placeholder="Buscar factura por numero o reserva..." />
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Numero</th>
              <th>Reserva</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody v-if="!isLoading && filteredFacturas.length">
            <tr v-for="factura in filteredFacturas" :key="factura.idFactura">
              <td><strong>{{ factura.facNumero }}</strong></td>
              <td>{{ factura.facIdReserva }}</td>
              <td>{{ clienteMap[factura.facIdCliente] || factura.facIdCliente }}</td>
              <td>{{ formatDate(factura.facFechaEmisionUtc) }}</td>
              <td><strong>{{ formatCurrency(factura.facTotal) }}</strong></td>
              <td><AdminStatusBadge v-bind="invoiceStateMeta(factura.facEstado)" /></td>
              <td>
                <div class="admin-actions">
                  <button type="button" class="admin-icon-button admin-icon-button--success" @click="handleDownload(factura.idFactura, factura.facNumero)">
                    <Download :size="17" />
                  </button>
                  <button type="button" class="admin-icon-button" @click="openDetail(factura.idFactura)">
                    <Eye :size="17" />
                  </button>
                  <button
                    v-if="factura.facEstado !== 'ANU'"
                    type="button"
                    class="admin-icon-button admin-icon-button--danger"
                    @click="handleAnular(factura.idFactura)"
                  >
                    <Trash2 :size="17" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="isLoading" class="admin-card__section">
          <p class="admin-state-message">Cargando facturas...</p>
        </div>

        <div v-else-if="!filteredFacturas.length" class="admin-card__section">
          <AdminEmptyState title="No hay facturas emitidas" description="Genera una nueva factura desde este modulo." />
        </div>
      </div>
    </div>

    <AdminModal v-if="activeModal === 'form'" title="Nueva Factura" @close="closeModal">
      <form class="admin-form" @submit.prevent="submitFactura">
        <div class="admin-field">
          <label>Reserva *</label>
          <select v-model="form.facIdReserva" required @change="hydrateFacturaForm">
            <option value="">Seleccionar reserva...</option>
            <option v-for="reserva in reservaOptions" :key="reserva.id" :value="reserva.id">{{ reserva.label }}</option>
          </select>
        </div>

        <div class="admin-grid admin-grid--2">
          <div class="admin-field"><label>Numero factura *</label><input v-model="form.facNumero" required /></div>
          <div class="admin-field"><label>Estado *</label><select v-model="form.facEstado"><option value="EMI">Emitida</option><option value="PEN">Pendiente</option></select></div>
        </div>

        <div class="admin-grid admin-grid--3">
          <div class="admin-field"><label>Cliente</label><input :value="form.facIdCliente || '-'" readonly /></div>
          <div class="admin-field"><label>Subtotal</label><input v-model="form.facSubtotal" type="number" min="0" step="0.01" required /></div>
          <div class="admin-field"><label>Impuesto</label><input v-model="form.facImpuesto" type="number" min="0" step="0.01" required /></div>
        </div>

        <div class="admin-field">
          <label>Total *</label>
          <input v-model="form.facTotal" type="number" min="0" step="0.01" required />
        </div>
      </form>

      <template #footer>
        <button type="button" class="admin-button--secondary" @click="closeModal">Cancelar</button>
        <button type="button" class="admin-button" :disabled="isSubmitting" @click="submitFactura">
          {{ isSubmitting ? 'Generando...' : 'Generar Factura' }}
        </button>
      </template>
    </AdminModal>

    <AdminModal v-if="activeModal === 'detail' && selectedFactura" title="Detalle de Factura" @close="closeModal">
      <div class="admin-detail-grid">
        <article class="admin-detail-card">
          <dl>
            <div><dt>Numero</dt><dd>{{ selectedFactura.facNumero }}</dd></div>
            <div><dt>Reserva</dt><dd>{{ selectedFactura.facIdReserva }}</dd></div>
            <div><dt>Cliente</dt><dd>{{ selectedFactura.facIdCliente }}</dd></div>
          </dl>
        </article>
        <article class="admin-detail-card">
          <dl>
            <div><dt>Fecha de emision</dt><dd>{{ formatDate(selectedFactura.facFechaEmisionUtc) }}</dd></div>
            <div><dt>Estado</dt><dd><AdminStatusBadge v-bind="invoiceStateMeta(selectedFactura.facEstado)" /></dd></div>
            <div><dt>Total</dt><dd>{{ formatCurrency(selectedFactura.facTotal) }}</dd></div>
          </dl>
        </article>
      </div>
    </AdminModal>
  </section>
</template>
