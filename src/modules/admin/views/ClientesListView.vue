<script setup>
import { computed, onMounted, ref } from 'vue'
import { Eye, Pencil, Plus, UserRoundX } from 'lucide-vue-next'
import { useAuthStore } from '../../../stores/auth.store'
import { actualizarCliente, consultarClientes, crearCliente, obtenerCliente, inactivarCliente } from '../../../api/clientes.api'
import { AdminEmptyState, AdminModal, AdminPageHeader, AdminSearchBar, AdminStatusBadge } from '../components'
import { activeStateMeta, clienteNombre, getItems } from '../utils/panel'

const authStore = useAuthStore()
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchTerm = ref('')
const clientes = ref([])
const selectedCliente = ref(null)
const activeModal = ref('')
const form = ref(createClienteForm())
const fieldErrors = ref({})

function createClienteForm() {
  return {
    idCliente: '',
    cliNombres: '',
    cliApellidos: '',
    cliRazonSocial: '',
    cliTipoIdentificacion: 'CED',
    cliNumeroIdentificacion: '',
    cliCorreoElectronico: '',
    cliTelefono: '',
    cliDireccion: '',
    cliEsPersonaJuridica: false,
    cliEstado: 'ACT',
  }
}

const filteredClientes = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return clientes.value

  return clientes.value.filter((cliente) => {
    const haystack = [
      clienteNombre(cliente),
      cliente.cliNumeroIdentificacion,
      cliente.cliCorreoElectronico,
      cliente.cliTelefono,
      activeStateMeta(cliente.cliEstado).label,
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

function resetFieldErrors() {
  fieldErrors.value = {}
}

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isValidPersonName(value) {
  return /^[A-Za-zÁÉÍÓÚÑáéíóúñ' ]+$/.test(value)
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPhone(value) {
  return /^\d{7,15}$/.test(value)
}

function isValidIdentification(tipo, value) {
  if (tipo === 'CED') return /^\d{10}$/.test(value)
  if (tipo === 'RUC') return /^\d{13}$/.test(value)
  if (tipo === 'PAS') return /^[A-Za-z0-9]{6,20}$/.test(value)
  return value.length >= 6
}

function validateClienteForm() {
  const errors = {}

  form.value.cliNombres = normalizeText(form.value.cliNombres)
  form.value.cliApellidos = normalizeText(form.value.cliApellidos)
  form.value.cliCorreoElectronico = normalizeText(form.value.cliCorreoElectronico).toLowerCase()
  form.value.cliDireccion = normalizeText(form.value.cliDireccion)
  form.value.cliNumeroIdentificacion = String(form.value.cliNumeroIdentificacion ?? '').trim()
  form.value.cliTelefono = String(form.value.cliTelefono ?? '').replace(/\D/g, '')

  if (!form.value.cliNombres) {
    errors.cliNombres = 'Ingresa los nombres.'
  } else if (!isValidPersonName(form.value.cliNombres)) {
    errors.cliNombres = 'Los nombres solo deben contener letras y espacios.'
  }

  if (!form.value.cliApellidos) {
    errors.cliApellidos = 'Ingresa los apellidos.'
  } else if (!isValidPersonName(form.value.cliApellidos)) {
    errors.cliApellidos = 'Los apellidos solo deben contener letras y espacios.'
  }

  if (!form.value.cliNumeroIdentificacion) {
    errors.cliNumeroIdentificacion = 'Ingresa la identificacion.'
  } else if (!isValidIdentification(form.value.cliTipoIdentificacion, form.value.cliNumeroIdentificacion)) {
    errors.cliNumeroIdentificacion = 'La identificacion no cumple el formato esperado.'
  }

  if (!form.value.cliCorreoElectronico) {
    errors.cliCorreoElectronico = 'Ingresa el correo electronico.'
  } else if (!isValidEmail(form.value.cliCorreoElectronico)) {
    errors.cliCorreoElectronico = 'Ingresa un correo electronico valido.'
  }

  if (!form.value.cliTelefono) {
    errors.cliTelefono = 'Ingresa el telefono.'
  } else if (!isValidPhone(form.value.cliTelefono)) {
    errors.cliTelefono = 'El telefono debe tener entre 7 y 15 digitos.'
  }

  if (!form.value.cliDireccion || form.value.cliDireccion.length < 6) {
    errors.cliDireccion = 'Ingresa una direccion valida.'
  }

  fieldErrors.value = errors
  return !Object.keys(errors).length
}

async function loadClientes() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await consultarClientes({ pageNumber: 1, pageSize: 200 })
    clientes.value = getItems(response.data)
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudieron cargar los clientes.'
  } finally {
    isLoading.value = false
  }
}

async function openDetail(idCliente) {
  try {
    const response = await obtenerCliente(idCliente)
    selectedCliente.value = response.data
    activeModal.value = 'detail'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo obtener el cliente.'
  }
}

async function openEdit(idCliente) {
  try {
    const response = await obtenerCliente(idCliente)
    selectedCliente.value = response.data
    resetFieldErrors()
    form.value = {
      idCliente: response.data.idCliente,
      cliNombres: response.data.cliNombres ?? '',
      cliApellidos: response.data.cliApellidos ?? '',
      cliRazonSocial: response.data.cliRazonSocial ?? '',
      cliTipoIdentificacion: response.data.cliTipoIdentificacion ?? 'CED',
      cliNumeroIdentificacion: response.data.cliNumeroIdentificacion ?? '',
      cliCorreoElectronico: response.data.cliCorreoElectronico ?? '',
      cliTelefono: response.data.cliTelefono ?? '',
      cliDireccion: response.data.cliDireccion ?? '',
      cliEsPersonaJuridica: Boolean(response.data.cliEsPersonaJuridica),
      cliEstado: response.data.cliEstado ?? 'ACT',
    }
    activeModal.value = 'form'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo cargar el cliente.'
  }
}

function closeModal() {
  activeModal.value = ''
  selectedCliente.value = null
  form.value = createClienteForm()
  resetFieldErrors()
}

async function submitCliente() {
  isSubmitting.value = true
  resetMessages()

  try {
    if (!validateClienteForm()) {
      errorMessage.value = 'Corrige los campos marcados antes de guardar.'
      return
    }

    if (form.value.idCliente) {
      await actualizarCliente(form.value.idCliente, {
        idCliente: Number(form.value.idCliente),
        cliNombres: form.value.cliNombres,
        cliApellidos: form.value.cliApellidos,
        cliRazonSocial: form.value.cliRazonSocial || null,
        cliTipoIdentificacion: form.value.cliTipoIdentificacion,
        cliNumeroIdentificacion: form.value.cliNumeroIdentificacion,
        cliCorreoElectronico: form.value.cliCorreoElectronico,
        cliTelefono: form.value.cliTelefono,
        cliDireccion: form.value.cliDireccion,
        cliEsPersonaJuridica: form.value.cliEsPersonaJuridica,
        cliEstado: form.value.cliEstado,
        cliModificadoPorUsuario: authStore.user?.username ?? 'admin',
        cliModificadoDesde: 'web',
      })
      successMessage.value = 'Cliente actualizado correctamente.'
    } else {
      await crearCliente({
        cliNombres: form.value.cliNombres,
        cliApellidos: form.value.cliApellidos,
        cliRazonSocial: form.value.cliRazonSocial || null,
        cliTipoIdentificacion: form.value.cliTipoIdentificacion,
        cliNumeroIdentificacion: form.value.cliNumeroIdentificacion,
        cliCorreoElectronico: form.value.cliCorreoElectronico,
        cliTelefono: form.value.cliTelefono,
        cliDireccion: form.value.cliDireccion,
        cliEsPersonaJuridica: form.value.cliEsPersonaJuridica,
        cliCreadoPorUsuario: authStore.user?.username ?? 'admin',
      })
      successMessage.value = 'Cliente creado correctamente.'
    }

    closeModal()
    await loadClientes()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo guardar el cliente.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleInactivate(idCliente) {
  resetMessages()
  try {
    await inactivarCliente(idCliente)
    successMessage.value = 'Cliente inactivado correctamente.'
    await loadClientes()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo inactivar el cliente.'
  }
}

onMounted(loadClientes)
</script>

<template>
  <section class="admin-page">
    <AdminPageHeader title="Clientes" description="Gestion de clientes registrados">
      <button type="button" class="admin-button" @click="activeModal = 'form'">
        <Plus :size="18" />
        <span>Nuevo Cliente</span>
      </button>
    </AdminPageHeader>

    <p v-if="errorMessage" class="admin-state-message admin-state-message--error">{{ errorMessage }}</p>
    <p v-else-if="successMessage" class="admin-state-message admin-state-message--success">{{ successMessage }}</p>

    <div class="admin-card">
      <div class="admin-card__section">
        <AdminSearchBar v-model="searchTerm" placeholder="Buscar cliente por nombre, identificacion o correo..." />
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Identificacion</th>
              <th>Email</th>
              <th>Telefono</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody v-if="!isLoading && filteredClientes.length">
            <tr v-for="cliente in filteredClientes" :key="cliente.idCliente">
              <td>{{ cliente.idCliente }}</td>
              <td>
                <strong>{{ clienteNombre(cliente) }}</strong>
                <div class="admin-note">{{ cliente.cliTipoIdentificacion }}</div>
              </td>
              <td>{{ cliente.cliNumeroIdentificacion }}</td>
              <td>{{ cliente.cliCorreoElectronico || '-' }}</td>
              <td>{{ cliente.cliTelefono || '-' }}</td>
              <td>
                <AdminStatusBadge v-bind="activeStateMeta(cliente.cliEstado)" />
              </td>
              <td>
                <div class="admin-actions">
                  <button type="button" class="admin-icon-button" title="Ver" @click="openDetail(cliente.idCliente)">
                    <Eye :size="17" />
                  </button>
                  <button type="button" class="admin-icon-button" title="Editar" @click="openEdit(cliente.idCliente)">
                    <Pencil :size="17" />
                  </button>
                  <button
                    v-if="cliente.cliEstado === 'ACT'"
                    type="button"
                    class="admin-icon-button admin-icon-button--danger"
                    title="Inactivar"
                    @click="handleInactivate(cliente.idCliente)"
                  >
                    <UserRoundX :size="17" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="isLoading" class="admin-card__section">
          <p class="admin-state-message">Cargando clientes...</p>
        </div>

        <div v-else-if="!filteredClientes.length" class="admin-card__section">
          <AdminEmptyState title="No hay clientes registrados" description="Crea el primer cliente desde este modulo." />
        </div>
      </div>
    </div>

    <AdminModal
      v-if="activeModal === 'form'"
      :title="form.idCliente ? 'Editar Cliente' : 'Nuevo Cliente'"
      @close="closeModal"
    >
      <form class="admin-form" @submit.prevent="submitCliente">
        <div class="admin-grid admin-grid--2">
          <div class="admin-field">
            <label>Nombres *</label>
            <input v-model="form.cliNombres" required />
            <small v-if="fieldErrors.cliNombres" class="admin-field-error">{{ fieldErrors.cliNombres }}</small>
          </div>
          <div class="admin-field">
            <label>Apellidos *</label>
            <input v-model="form.cliApellidos" required />
            <small v-if="fieldErrors.cliApellidos" class="admin-field-error">{{ fieldErrors.cliApellidos }}</small>
          </div>
        </div>

        <div class="admin-grid admin-grid--2">
          <div class="admin-field">
            <label>Tipo de identificacion *</label>
            <select v-model="form.cliTipoIdentificacion" :disabled="Boolean(form.idCliente)">
              <option value="CED">CED</option>
              <option value="RUC">RUC</option>
              <option value="PAS">PAS</option>
            </select>
          </div>
          <div class="admin-field">
            <label>Numero de identificacion *</label>
            <input v-model="form.cliNumeroIdentificacion" :disabled="Boolean(form.idCliente)" required />
            <small v-if="fieldErrors.cliNumeroIdentificacion" class="admin-field-error">
              {{ fieldErrors.cliNumeroIdentificacion }}
            </small>
          </div>
        </div>

        <div class="admin-grid admin-grid--2">
          <div class="admin-field">
            <label>Correo electronico *</label>
            <input v-model="form.cliCorreoElectronico" type="email" required />
            <small v-if="fieldErrors.cliCorreoElectronico" class="admin-field-error">
              {{ fieldErrors.cliCorreoElectronico }}
            </small>
          </div>
          <div class="admin-field">
            <label>Telefono *</label>
            <input v-model="form.cliTelefono" required />
            <small v-if="fieldErrors.cliTelefono" class="admin-field-error">{{ fieldErrors.cliTelefono }}</small>
          </div>
        </div>

        <div class="admin-field">
          <label>Direccion *</label>
          <textarea v-model="form.cliDireccion" required />
          <small v-if="fieldErrors.cliDireccion" class="admin-field-error">{{ fieldErrors.cliDireccion }}</small>
        </div>

        <div v-if="form.idCliente" class="admin-field">
          <label>Estado *</label>
          <select v-model="form.cliEstado">
            <option value="ACT">Activo</option>
            <option value="INA">Inactivo</option>
          </select>
        </div>
      </form>

      <template #footer>
        <button type="button" class="admin-button--secondary" @click="closeModal">Cancelar</button>
        <button type="button" class="admin-button" :disabled="isSubmitting" @click="submitCliente">
          {{ isSubmitting ? 'Guardando...' : 'Guardar Cliente' }}
        </button>
      </template>
    </AdminModal>

    <AdminModal v-if="activeModal === 'detail' && selectedCliente" title="Detalle del Cliente" @close="closeModal">
      <div class="admin-detail-grid">
        <article class="admin-detail-card">
          <dl>
            <div>
              <dt>Nombre completo</dt>
              <dd>{{ clienteNombre(selectedCliente) }}</dd>
            </div>
            <div>
              <dt>Identificacion</dt>
              <dd>{{ selectedCliente.cliTipoIdentificacion }} · {{ selectedCliente.cliNumeroIdentificacion }}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd><AdminStatusBadge v-bind="activeStateMeta(selectedCliente.cliEstado)" /></dd>
            </div>
          </dl>
        </article>
        <article class="admin-detail-card">
          <dl>
            <div>
              <dt>Correo</dt>
              <dd>{{ selectedCliente.cliCorreoElectronico || '-' }}</dd>
            </div>
            <div>
              <dt>Telefono</dt>
              <dd>{{ selectedCliente.cliTelefono || '-' }}</dd>
            </div>
            <div>
              <dt>Direccion</dt>
              <dd>{{ selectedCliente.cliDireccion || '-' }}</dd>
            </div>
          </dl>
        </article>
      </div>

      <template #footer>
        <button type="button" class="admin-button--secondary" @click="closeModal">Cerrar</button>
        <button type="button" class="admin-button" @click="openEdit(selectedCliente.idCliente)">Editar Cliente</button>
      </template>
    </AdminModal>
  </section>
</template>

<style scoped>
.admin-field-error {
  display: block;
  margin-top: 0.35rem;
  color: #dc2626;
  font-size: 0.82rem;
  font-weight: 600;
}
</style>
