<script setup>
import { computed, onMounted, ref } from 'vue'
import { Eye, Pencil, Plus, UserRoundX } from 'lucide-vue-next'
import { useAuthStore } from '../../../stores/auth.store'
import { actualizarConductor, consultarConductores, crearConductor, obtenerConductor, inactivarConductor } from '../../../api/conductores.api'
import { AdminEmptyState, AdminModal, AdminPageHeader, AdminSearchBar, AdminStatusBadge } from '../components'
import { activeStateMeta, conductorNombre, formatDate, getItems } from '../utils/panel'

const authStore = useAuthStore()
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchTerm = ref('')
const conductores = ref([])
const selectedConductor = ref(null)
const activeModal = ref('')
const form = ref(createConductorForm())

function createConductorForm() {
  return {
    idConductor: '',
    tipoIdentificacion: 'CED',
    numeroIdentificacion: '',
    conNombre1: '',
    conNombre2: '',
    conApellido1: '',
    conApellido2: '',
    numeroLicencia: '',
    fechaVencimientoLicencia: '',
    edadConductor: 18,
    conTelefono: '',
    conCorreo: '',
    estadoConductor: 'ACT',
  }
}

const filteredConductores = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return conductores.value

  return conductores.value.filter((conductor) => {
    const haystack = [
      conductorNombre(conductor),
      conductor.numeroLicencia,
      conductor.numeroIdentificacion,
      conductor.conTelefono,
      conductor.conCorreo,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  })
})

function resetMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

async function loadConductores() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await consultarConductores({ pageNumber: 1, pageSize: 200 })
    conductores.value = getItems(response.data)
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudieron cargar los conductores.'
  } finally {
    isLoading.value = false
  }
}

async function openDetail(idConductor) {
  try {
    const response = await obtenerConductor(idConductor)
    selectedConductor.value = response.data
    activeModal.value = 'detail'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo obtener el conductor.'
  }
}

async function openEdit(idConductor) {
  try {
    const response = await obtenerConductor(idConductor)
    const conductor = response.data
    selectedConductor.value = conductor
    form.value = {
      idConductor: conductor.idConductor,
      tipoIdentificacion: conductor.tipoIdentificacion ?? 'CED',
      numeroIdentificacion: conductor.numeroIdentificacion ?? '',
      conNombre1: conductor.conNombre1 ?? '',
      conNombre2: conductor.conNombre2 ?? '',
      conApellido1: conductor.conApellido1 ?? '',
      conApellido2: conductor.conApellido2 ?? '',
      numeroLicencia: conductor.numeroLicencia ?? '',
      fechaVencimientoLicencia: conductor.fechaVencimientoLicencia?.slice(0, 10) ?? '',
      edadConductor: conductor.edadConductor ?? 18,
      conTelefono: conductor.conTelefono ?? '',
      conCorreo: conductor.conCorreo ?? '',
      estadoConductor: conductor.estadoConductor ?? 'ACT',
    }
    activeModal.value = 'form'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo cargar el conductor.'
  }
}

function closeModal() {
  activeModal.value = ''
  selectedConductor.value = null
  form.value = createConductorForm()
}

async function submitConductor() {
  isSubmitting.value = true
  resetMessages()

  try {
    if (form.value.idConductor) {
      await actualizarConductor(form.value.idConductor, {
        idConductor: Number(form.value.idConductor),
        conNombre1: form.value.conNombre1,
        conNombre2: form.value.conNombre2 || null,
        conApellido1: form.value.conApellido1,
        conApellido2: form.value.conApellido2 || null,
        numeroLicencia: form.value.numeroLicencia,
        fechaVencimientoLicencia: form.value.fechaVencimientoLicencia,
        edadConductor: Number(form.value.edadConductor),
        conTelefono: form.value.conTelefono,
        conCorreo: form.value.conCorreo,
        estadoConductor: form.value.estadoConductor,
        modificadoPorUsuario: authStore.user?.username ?? 'admin',
      })
      successMessage.value = 'Conductor actualizado correctamente.'
    } else {
      await crearConductor({
        tipoIdentificacion: form.value.tipoIdentificacion,
        numeroIdentificacion: form.value.numeroIdentificacion,
        conNombre1: form.value.conNombre1,
        conNombre2: form.value.conNombre2 || null,
        conApellido1: form.value.conApellido1,
        conApellido2: form.value.conApellido2 || null,
        numeroLicencia: form.value.numeroLicencia,
        fechaVencimientoLicencia: form.value.fechaVencimientoLicencia,
        edadConductor: Number(form.value.edadConductor),
        conTelefono: form.value.conTelefono,
        conCorreo: form.value.conCorreo,
        creadoPorUsuario: authStore.user?.username ?? 'admin',
        origenRegistro: 'web',
      })
      successMessage.value = 'Conductor creado correctamente.'
    }

    closeModal()
    await loadConductores()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo guardar el conductor.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleInactivate(idConductor) {
  resetMessages()
  try {
    await inactivarConductor(idConductor)
    successMessage.value = 'Conductor inactivado correctamente.'
    await loadConductores()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo inactivar el conductor.'
  }
}

onMounted(loadConductores)
</script>

<template>
  <section class="admin-page">
    <AdminPageHeader title="Conductores" description="Gestion de conductores autorizados">
      <button type="button" class="admin-button" @click="activeModal = 'form'">
        <Plus :size="18" />
        <span>Nuevo Conductor</span>
      </button>
    </AdminPageHeader>

    <p v-if="errorMessage" class="admin-state-message admin-state-message--error">{{ errorMessage }}</p>
    <p v-else-if="successMessage" class="admin-state-message admin-state-message--success">{{ successMessage }}</p>

    <div class="admin-card">
      <div class="admin-card__section">
        <AdminSearchBar v-model="searchTerm" placeholder="Buscar conductor por nombre, licencia o identificacion..." />
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Licencia</th>
              <th>Identificacion</th>
              <th>Contacto</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody v-if="!isLoading && filteredConductores.length">
            <tr v-for="conductor in filteredConductores" :key="conductor.idConductor">
              <td>
                <strong>{{ conductorNombre(conductor) }}</strong>
                <div class="admin-note">ID: {{ conductor.idConductor }}</div>
              </td>
              <td>{{ conductor.numeroLicencia }}</td>
              <td>{{ conductor.tipoIdentificacion }} · {{ conductor.numeroIdentificacion }}</td>
              <td>
                <div>{{ conductor.conTelefono || '-' }}</div>
                <div class="admin-note">{{ conductor.conCorreo || '-' }}</div>
              </td>
              <td>{{ formatDate(conductor.fechaVencimientoLicencia) }}</td>
              <td><AdminStatusBadge v-bind="activeStateMeta(conductor.estadoConductor)" /></td>
              <td>
                <div class="admin-actions">
                  <button type="button" class="admin-icon-button" @click="openDetail(conductor.idConductor)">
                    <Eye :size="17" />
                  </button>
                  <button type="button" class="admin-icon-button" @click="openEdit(conductor.idConductor)">
                    <Pencil :size="17" />
                  </button>
                  <button
                    v-if="conductor.estadoConductor === 'ACT'"
                    type="button"
                    class="admin-icon-button admin-icon-button--danger"
                    @click="handleInactivate(conductor.idConductor)"
                  >
                    <UserRoundX :size="17" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="isLoading" class="admin-card__section">
          <p class="admin-state-message">Cargando conductores...</p>
        </div>

        <div v-else-if="!filteredConductores.length" class="admin-card__section">
          <AdminEmptyState title="No hay conductores registrados" description="Agrega conductores autorizados para las reservas." />
        </div>
      </div>
    </div>

    <AdminModal v-if="activeModal === 'form'" :title="form.idConductor ? 'Editar Conductor' : 'Nuevo Conductor'" size="lg" @close="closeModal">
      <form class="admin-form" @submit.prevent="submitConductor">
        <div class="admin-grid admin-grid--3">
          <div class="admin-field">
            <label>Tipo *</label>
            <select v-model="form.tipoIdentificacion" :disabled="Boolean(form.idConductor)">
              <option value="CED">CED</option>
              <option value="RUC">RUC</option>
              <option value="PAS">PAS</option>
            </select>
          </div>
          <div class="admin-field">
            <label>Identificacion *</label>
            <input v-model="form.numeroIdentificacion" :disabled="Boolean(form.idConductor)" required />
          </div>
          <div class="admin-field">
            <label>Numero licencia *</label>
            <input v-model="form.numeroLicencia" required />
          </div>
        </div>

        <div class="admin-grid admin-grid--2">
          <div class="admin-field"><label>Primer nombre *</label><input v-model="form.conNombre1" required /></div>
          <div class="admin-field"><label>Segundo nombre</label><input v-model="form.conNombre2" /></div>
        </div>

        <div class="admin-grid admin-grid--2">
          <div class="admin-field"><label>Primer apellido *</label><input v-model="form.conApellido1" required /></div>
          <div class="admin-field"><label>Segundo apellido</label><input v-model="form.conApellido2" /></div>
        </div>

        <div class="admin-grid admin-grid--3">
          <div class="admin-field"><label>Vencimiento licencia *</label><input v-model="form.fechaVencimientoLicencia" type="date" required /></div>
          <div class="admin-field"><label>Edad *</label><input v-model="form.edadConductor" type="number" min="18" required /></div>
          <div v-if="form.idConductor" class="admin-field"><label>Estado *</label><select v-model="form.estadoConductor"><option value="ACT">Activo</option><option value="INA">Inactivo</option></select></div>
        </div>

        <div class="admin-grid admin-grid--2">
          <div class="admin-field"><label>Telefono *</label><input v-model="form.conTelefono" required /></div>
          <div class="admin-field"><label>Correo *</label><input v-model="form.conCorreo" type="email" required /></div>
        </div>
      </form>

      <template #footer>
        <button type="button" class="admin-button--secondary" @click="closeModal">Cancelar</button>
        <button type="button" class="admin-button" :disabled="isSubmitting" @click="submitConductor">
          {{ isSubmitting ? 'Guardando...' : 'Guardar Conductor' }}
        </button>
      </template>
    </AdminModal>

    <AdminModal v-if="activeModal === 'detail' && selectedConductor" title="Detalle del Conductor" @close="closeModal">
      <div class="admin-detail-grid">
        <article class="admin-detail-card">
          <dl>
            <div><dt>Conductor</dt><dd>{{ conductorNombre(selectedConductor) }}</dd></div>
            <div><dt>Licencia</dt><dd>{{ selectedConductor.numeroLicencia }}</dd></div>
            <div><dt>Vencimiento</dt><dd>{{ formatDate(selectedConductor.fechaVencimientoLicencia) }}</dd></div>
          </dl>
        </article>
        <article class="admin-detail-card">
          <dl>
            <div><dt>Identificacion</dt><dd>{{ selectedConductor.tipoIdentificacion }} · {{ selectedConductor.numeroIdentificacion }}</dd></div>
            <div><dt>Telefono</dt><dd>{{ selectedConductor.conTelefono || '-' }}</dd></div>
            <div><dt>Correo</dt><dd>{{ selectedConductor.conCorreo || '-' }}</dd></div>
          </dl>
        </article>
      </div>
    </AdminModal>
  </section>
</template>
