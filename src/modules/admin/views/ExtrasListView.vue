<script setup>
import { computed, onMounted, ref } from 'vue'
import { Eye, Pencil, Plus, Power } from 'lucide-vue-next'
import { useAuthStore } from '../../../stores/auth.store'
import { actualizarExtra, crearExtra, inactivarExtra, listarExtras, obtenerExtra } from '../../../api/extras.api'
import { AdminEmptyState, AdminModal, AdminPageHeader, AdminSearchBar, AdminStatusBadge } from '../components'
import { activeStateMeta, formatCurrency, getItems } from '../utils/panel'

const authStore = useAuthStore()
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchTerm = ref('')
const extras = ref([])
const selectedExtra = ref(null)
const activeModal = ref('')
const form = ref(createExtraForm())

function createExtraForm() {
  return {
    idExtra: '',
    codigoExtra: '',
    nombreExtra: '',
    descripcionExtra: '',
    valorFijo: 0,
    estadoExtra: 'ACT',
  }
}

const filteredExtras = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return extras.value

  return extras.value.filter((extra) =>
    [extra.codigoExtra, extra.nombreExtra, extra.descripcionExtra].filter(Boolean).join(' ').toLowerCase().includes(term),
  )
})

function resetMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

async function loadExtras() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await listarExtras()
    extras.value = getItems(response.data)
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudieron cargar los extras.'
  } finally {
    isLoading.value = false
  }
}

async function openDetail(idExtra) {
  try {
    const response = await obtenerExtra(idExtra)
    selectedExtra.value = response.data
    activeModal.value = 'detail'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo obtener el extra.'
  }
}

async function openEdit(idExtra) {
  try {
    const response = await obtenerExtra(idExtra)
    const extra = response.data
    selectedExtra.value = extra
    form.value = {
      idExtra: extra.idExtra,
      codigoExtra: extra.codigoExtra ?? '',
      nombreExtra: extra.nombreExtra ?? '',
      descripcionExtra: extra.descripcionExtra ?? '',
      valorFijo: extra.valorFijo ?? 0,
      estadoExtra: extra.estadoExtra ?? 'ACT',
    }
    activeModal.value = 'form'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo cargar el extra.'
  }
}

function closeModal() {
  activeModal.value = ''
  selectedExtra.value = null
  form.value = createExtraForm()
}

async function submitExtra() {
  isSubmitting.value = true
  resetMessages()

  try {
    if (form.value.idExtra) {
      await actualizarExtra(form.value.idExtra, {
        idExtra: Number(form.value.idExtra),
        nombreExtra: form.value.nombreExtra,
        descripcionExtra: form.value.descripcionExtra,
        valorFijo: Number(form.value.valorFijo),
        estadoExtra: form.value.estadoExtra,
      })
      successMessage.value = 'Extra actualizado correctamente.'
    } else {
      await crearExtra({
        codigoExtra: form.value.codigoExtra,
        nombreExtra: form.value.nombreExtra,
        descripcionExtra: form.value.descripcionExtra,
        valorFijo: Number(form.value.valorFijo),
        creadoPorUsuario: authStore.user?.username ?? 'admin',
        origenRegistro: 'web',
      })
      successMessage.value = 'Extra creado correctamente.'
    }

    closeModal()
    await loadExtras()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo guardar el extra.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleInactivate(idExtra) {
  resetMessages()
  try {
    await inactivarExtra(idExtra)
    successMessage.value = 'Extra inactivado correctamente.'
    await loadExtras()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo inactivar el extra.'
  }
}

onMounted(loadExtras)
</script>

<template>
  <section class="admin-page">
    <AdminPageHeader title="Extras" description="Servicios adicionales disponibles para reserva">
      <button type="button" class="admin-button" @click="activeModal = 'form'">
        <Plus :size="18" />
        <span>Nuevo Extra</span>
      </button>
    </AdminPageHeader>

    <p v-if="errorMessage" class="admin-state-message admin-state-message--error">{{ errorMessage }}</p>
    <p v-else-if="successMessage" class="admin-state-message admin-state-message--success">{{ successMessage }}</p>

    <div class="admin-card">
      <div class="admin-card__section">
        <AdminSearchBar v-model="searchTerm" placeholder="Buscar extra por codigo, nombre o descripcion..." />
      </div>
    </div>

    <div v-if="isLoading" class="admin-state-message">Cargando extras...</div>

    <div v-else-if="!filteredExtras.length" class="admin-card admin-card__section">
      <AdminEmptyState title="No hay extras disponibles" description="Crea extras para ofrecer servicios adicionales." />
    </div>

    <div v-else class="extras-grid">
      <article v-for="extra in filteredExtras" :key="extra.idExtra" class="admin-card extra-card">
        <div class="extra-card__header">
          <div>
            <div class="admin-note">{{ extra.codigoExtra }}</div>
            <h2>{{ extra.nombreExtra }}</h2>
          </div>
          <AdminStatusBadge v-bind="activeStateMeta(extra.estadoExtra)" />
        </div>

        <p>{{ extra.descripcionExtra || 'Sin descripcion registrada.' }}</p>

        <div class="extra-card__footer">
          <strong>{{ formatCurrency(extra.valorFijo) }}/dia</strong>
          <div class="admin-actions">
            <button type="button" class="admin-icon-button" @click="openDetail(extra.idExtra)"><Eye :size="17" /></button>
            <button type="button" class="admin-icon-button" @click="openEdit(extra.idExtra)"><Pencil :size="17" /></button>
            <button
              v-if="extra.estadoExtra === 'ACT'"
              type="button"
              class="admin-icon-button admin-icon-button--danger"
              @click="handleInactivate(extra.idExtra)"
            >
              <Power :size="17" />
            </button>
          </div>
        </div>
      </article>
    </div>

    <AdminModal v-if="activeModal === 'form'" :title="form.idExtra ? 'Editar Extra' : 'Nuevo Extra'" @close="closeModal">
      <form class="admin-form" @submit.prevent="submitExtra">
        <div class="admin-grid admin-grid--2">
          <div class="admin-field"><label>Codigo *</label><input v-model="form.codigoExtra" :disabled="Boolean(form.idExtra)" required /></div>
          <div class="admin-field"><label>Nombre *</label><input v-model="form.nombreExtra" required /></div>
        </div>
        <div class="admin-field"><label>Descripcion *</label><textarea v-model="form.descripcionExtra" required /></div>
        <div class="admin-grid admin-grid--2">
          <div class="admin-field"><label>Valor fijo por dia *</label><input v-model="form.valorFijo" type="number" min="0" step="0.01" required /></div>
          <div v-if="form.idExtra" class="admin-field"><label>Estado *</label><select v-model="form.estadoExtra"><option value="ACT">Activo</option><option value="INA">Inactivo</option></select></div>
        </div>
      </form>

      <template #footer>
        <button type="button" class="admin-button--secondary" @click="closeModal">Cancelar</button>
        <button type="button" class="admin-button" :disabled="isSubmitting" @click="submitExtra">
          {{ isSubmitting ? 'Guardando...' : 'Guardar Extra' }}
        </button>
      </template>
    </AdminModal>

    <AdminModal v-if="activeModal === 'detail' && selectedExtra" title="Detalle del Extra" @close="closeModal">
      <div class="admin-detail-grid">
        <article class="admin-detail-card">
          <dl>
            <div><dt>Codigo</dt><dd>{{ selectedExtra.codigoExtra }}</dd></div>
            <div><dt>Nombre</dt><dd>{{ selectedExtra.nombreExtra }}</dd></div>
            <div><dt>Estado</dt><dd><AdminStatusBadge v-bind="activeStateMeta(selectedExtra.estadoExtra)" /></dd></div>
          </dl>
        </article>
        <article class="admin-detail-card">
          <dl>
            <div><dt>Precio</dt><dd>{{ formatCurrency(selectedExtra.valorFijo) }}/dia</dd></div>
            <div><dt>Descripcion</dt><dd>{{ selectedExtra.descripcionExtra || '-' }}</dd></div>
          </dl>
        </article>
      </div>
    </AdminModal>
  </section>
</template>

<style scoped>
.extras-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.extra-card {
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
}

.extra-card__header,
.extra-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.extra-card__header h2,
.extra-card p {
  margin: 0;
}

.extra-card p {
  color: var(--color-text-muted);
}

@media (max-width: 1200px) {
  .extras-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .extras-grid {
    grid-template-columns: 1fr;
  }
}
</style>
