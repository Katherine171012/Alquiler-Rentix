<script setup>
import { computed, onMounted, ref } from 'vue'
import { Eye, Search } from 'lucide-vue-next'
import { buscarAuditorias, obtenerAuditoria } from '../../../api/auditoria.api'
import { AdminEmptyState, AdminModal, AdminPageHeader, AdminSearchBar, AdminStatusBadge } from '../components'
import { formatDateTime, getItems } from '../utils/panel'

const isLoading = ref(true)
const errorMessage = ref('')
const searchTerm = ref('')
const selectedTable = ref('')
const selectedOperation = ref('')
const auditorias = ref([])
const selectedAuditoria = ref(null)

const availableTables = computed(() =>
  [...new Set(auditorias.value.map((item) => item.tablaAfectada).filter(Boolean))].sort(),
)

const availableOperations = computed(() =>
  [...new Set(auditorias.value.map((item) => item.operacion).filter(Boolean))].sort(),
)

const filteredAuditorias = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()

  return auditorias.value.filter((item) => {
    const matchesTable = !selectedTable.value || item.tablaAfectada === selectedTable.value
    const matchesOperation = !selectedOperation.value || item.operacion === selectedOperation.value
    const haystack = [
      item.usuarioEjecutor,
      item.tablaAfectada,
      item.operacion,
      item.idRegistroAfectado,
      item.ipOrigen,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesTerm = !term || haystack.includes(term)
    return matchesTable && matchesOperation && matchesTerm
  })
})

function operationTone(operation) {
  if (operation === 'CREATE' || operation === 'CREAR') return 'success'
  if (operation === 'UPDATE' || operation === 'MODIFICAR') return 'info'
  if (operation === 'DELETE' || operation === 'ELIMINAR') return 'danger'
  return 'neutral'
}

async function loadAuditorias() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await buscarAuditorias({ pageNumber: 1, pageSize: 200 })
    auditorias.value = getItems(response.data)
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo cargar la auditoria.'
  } finally {
    isLoading.value = false
  }
}

async function openDetail(idAuditoria) {
  try {
    const response = await obtenerAuditoria(idAuditoria)
    selectedAuditoria.value = response.data
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo obtener el detalle de auditoria.'
  }
}

onMounted(loadAuditorias)
</script>

<template>
  <section class="admin-page">
    <AdminPageHeader title="Auditoria" description="Historial de acciones y cambios en el sistema" />

    <p v-if="errorMessage" class="admin-state-message admin-state-message--error">{{ errorMessage }}</p>

    <div class="admin-card">
      <div class="admin-card__section audit-filters">
        <AdminSearchBar v-model="searchTerm" placeholder="Buscar por usuario, modulo, operacion o IP..." />
        <select v-model="selectedTable">
          <option value="">Todos los modulos</option>
          <option v-for="item in availableTables" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="selectedOperation">
          <option value="">Todas las acciones</option>
          <option v-for="item in availableOperations" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Fecha / Hora</th>
              <th>Usuario</th>
              <th>Modulo</th>
              <th>Accion</th>
              <th>Registro</th>
              <th>IP</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody v-if="!isLoading && filteredAuditorias.length">
            <tr v-for="item in filteredAuditorias" :key="item.idAuditoria">
              <td>{{ formatDateTime(item.fechaEventoUtc) }}</td>
              <td>{{ item.usuarioEjecutor || '-' }}</td>
              <td>{{ item.tablaAfectada || '-' }}</td>
              <td>
                <AdminStatusBadge :label="item.operacion || '-'" :tone="operationTone(item.operacion)" />
              </td>
              <td>{{ item.idRegistroAfectado || '-' }}</td>
              <td>{{ item.ipOrigen || '-' }}</td>
              <td>
                <button type="button" class="admin-icon-button" title="Ver detalle" @click="openDetail(item.idAuditoria)">
                  <Eye :size="17" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="isLoading" class="admin-card__section">
          <p class="admin-state-message">Cargando auditoria...</p>
        </div>

        <div v-else-if="!filteredAuditorias.length" class="admin-card__section">
          <AdminEmptyState title="No hay eventos para mostrar" description="Ajusta los filtros o revisa cuando el backend registre actividad." >
            <template #icon>
              <Search :size="24" />
            </template>
          </AdminEmptyState>
        </div>
      </div>
    </div>

    <AdminModal v-if="selectedAuditoria" title="Detalle de Auditoria" size="lg" @close="selectedAuditoria = null">
      <div class="admin-detail-grid">
        <article class="admin-detail-card">
          <dl>
            <div>
              <dt>Usuario</dt>
              <dd>{{ selectedAuditoria.usuarioEjecutor || '-' }}</dd>
            </div>
            <div>
              <dt>Fecha del evento</dt>
              <dd>{{ formatDateTime(selectedAuditoria.fechaEventoUtc) }}</dd>
            </div>
            <div>
              <dt>IP origen</dt>
              <dd>{{ selectedAuditoria.ipOrigen || '-' }}</dd>
            </div>
          </dl>
        </article>

        <article class="admin-detail-card">
          <dl>
            <div>
              <dt>Modulo</dt>
              <dd>{{ selectedAuditoria.tablaAfectada || '-' }}</dd>
            </div>
            <div>
              <dt>Operacion</dt>
              <dd>{{ selectedAuditoria.operacion || '-' }}</dd>
            </div>
            <div>
              <dt>Registro afectado</dt>
              <dd>{{ selectedAuditoria.idRegistroAfectado || '-' }}</dd>
            </div>
          </dl>
        </article>
      </div>

      <div class="admin-grid admin-grid--2" style="margin-top: 1rem">
        <div class="admin-field">
          <label>Datos anteriores</label>
          <textarea :value="selectedAuditoria.datosAnteriores || ''" readonly />
        </div>
        <div class="admin-field">
          <label>Datos nuevos</label>
          <textarea :value="selectedAuditoria.datosNuevos || ''" readonly />
        </div>
      </div>
    </AdminModal>
  </section>
</template>

<style scoped>
.audit-filters {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(2, minmax(14rem, 1fr));
  gap: 1rem;
}

.audit-filters select {
  min-height: 3.5rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 0 1rem;
  background: #fff;
  font: inherit;
}

@media (max-width: 960px) {
  .audit-filters {
    grid-template-columns: 1fr;
  }
}
</style>
