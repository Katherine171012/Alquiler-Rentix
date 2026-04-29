<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Boxes, CarFront, Globe, MapPin, Pencil, Plus, ShieldCheck, Tags, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '../../../stores/auth.store'
import { actualizarCategoriaVehiculo, crearCategoriaVehiculo, inactivarCategoriaVehiculo, listarCategoriasVehiculo } from '../../../api/categoriasVehiculo.api'
import { actualizarCiudad, crearCiudad, inactivarCiudad, listarCiudades } from '../../../api/ciudades.api'
import {
  actualizarLocalizacion,
  crearLocalizacion,
  inactivarLocalizacion,
  listarLocalizaciones,
} from '../../../api/localizaciones.api'
import { actualizarMarcaVehiculo, crearMarcaVehiculo, inactivarMarcaVehiculo, listarMarcasVehiculo } from '../../../api/marcasVehiculo.api'
import { actualizarPais, crearPais, inactivarPais, listarPaises } from '../../../api/paises.api'
import { actualizarRol, crearRol, inactivarRol, listarRoles } from '../../../api/roles.api'
import { AdminEmptyState, AdminModal, AdminPageHeader, AdminSearchBar, AdminStatusBadge } from '../components'
import { activeStateMeta, getItems } from '../utils/panel'

const authStore = useAuthStore()

const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const managerSearch = ref('')
const selectedCatalog = ref('')
const managerOpen = ref(false)
const formOpen = ref(false)
const editingItem = ref(null)

const datasets = reactive({
  roles: [],
  marcas: [],
  categorias: [],
  paises: [],
  ciudades: [],
  localizaciones: [],
})

const form = reactive(createEmptyForm())

const catalogMeta = {
  roles: {
    key: 'roles',
    title: 'Roles',
    description: 'Gestion de permisos y perfiles de usuario',
    icon: ShieldCheck,
  },
  marcas: {
    key: 'marcas',
    title: 'Marcas',
    description: 'Catalogo de marcas de vehiculos',
    icon: Tags,
  },
  categorias: {
    key: 'categorias',
    title: 'Categorias',
    description: 'Categorias comerciales de vehiculos',
    icon: CarFront,
  },
  paises: {
    key: 'paises',
    title: 'Paises',
    description: 'Paises disponibles en catalogos operativos',
    icon: Globe,
  },
  ciudades: {
    key: 'ciudades',
    title: 'Ciudades',
    description: 'Ciudades asociadas a los paises del sistema',
    icon: MapPin,
  },
  localizaciones: {
    key: 'localizaciones',
    title: 'Localizaciones',
    description: 'Puntos de entrega y recogida',
    icon: Boxes,
  },
}

function createEmptyForm() {
  return {
    id: '',
    nombreRol: '',
    descripcionRol: '',
    estadoRol: 'ACT',
    nombreMarca: '',
    estadoMarca: 'ACT',
    nombreCategoria: '',
    descripcionCategoria: '',
    estadoCategoria: 'ACT',
    nombrePais: '',
    estadoPais: 'ACT',
    nombreCiudad: '',
    idPais: '',
    estadoCiudad: 'ACT',
    nombreLocalizacion: '',
    idCiudad: '',
    direccionLocalizacion: '',
    telefonoContacto: '',
    correoContacto: '',
    horarioAtencion: '',
    zonaHoraria: 'America/Guayaquil',
    estadoLocalizacion: 'ACT',
  }
}

function resetForm() {
  Object.assign(form, createEmptyForm())
}

const cards = computed(() =>
  Object.values(catalogMeta).map((item) => ({
    ...item,
    count: datasets[item.key].length,
  })),
)

const currentMeta = computed(() => catalogMeta[selectedCatalog.value] ?? null)
const currentItems = computed(() => datasets[selectedCatalog.value] ?? [])

const filteredItems = computed(() => {
  const term = managerSearch.value.trim().toLowerCase()
  if (!term) return currentItems.value

  return currentItems.value.filter((item) => JSON.stringify(item).toLowerCase().includes(term))
})

const countryOptions = computed(() => datasets.paises)
const cityOptions = computed(() => datasets.ciudades)

function resetMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

async function loadCatalogs() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [rolesResponse, marcasResponse, categoriasResponse, paisesResponse, ciudadesResponse, localizacionesResponse] =
      await Promise.all([
        listarRoles(),
        listarMarcasVehiculo(),
        listarCategoriasVehiculo(),
        listarPaises(),
        listarCiudades(),
        listarLocalizaciones(),
      ])

    datasets.roles = getItems(rolesResponse.data)
    datasets.marcas = getItems(marcasResponse.data)
    datasets.categorias = getItems(categoriasResponse.data)
    datasets.paises = getItems(paisesResponse.data)
    datasets.ciudades = getItems(ciudadesResponse.data)
    datasets.localizaciones = getItems(localizacionesResponse.data)
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo cargar la configuracion.'
  } finally {
    isLoading.value = false
  }
}

function openManager(key) {
  selectedCatalog.value = key
  managerSearch.value = ''
  managerOpen.value = true
}

function closeManager() {
  managerOpen.value = false
  formOpen.value = false
  selectedCatalog.value = ''
  editingItem.value = null
  resetForm()
}

function openCreateForm() {
  editingItem.value = null
  resetForm()
  formOpen.value = true
}

function openEditForm(item) {
  editingItem.value = item
  resetForm()

  if (selectedCatalog.value === 'roles') {
    form.id = item.idRol
    form.nombreRol = item.nombreRol ?? ''
    form.descripcionRol = item.descripcionRol ?? ''
    form.estadoRol = item.estadoRol ?? 'ACT'
  }

  if (selectedCatalog.value === 'marcas') {
    form.id = item.idMarca
    form.nombreMarca = item.nombreMarca ?? ''
    form.estadoMarca = item.estadoMarca ?? 'ACT'
  }

  if (selectedCatalog.value === 'categorias') {
    form.id = item.idCategoria
    form.nombreCategoria = item.nombreCategoria ?? ''
    form.descripcionCategoria = item.descripcionCategoria ?? ''
    form.estadoCategoria = item.estadoCategoria ?? 'ACT'
  }

  if (selectedCatalog.value === 'paises') {
    form.id = item.idPais
    form.nombrePais = item.nombrePais ?? ''
    form.estadoPais = item.estadoPais ?? 'ACT'
  }

  if (selectedCatalog.value === 'ciudades') {
    form.id = item.idCiudad
    form.nombreCiudad = item.nombreCiudad ?? ''
    form.idPais = item.idPais ?? ''
    form.estadoCiudad = item.estadoCiudad ?? 'ACT'
  }

  if (selectedCatalog.value === 'localizaciones') {
    form.id = item.idLocalizacion
    form.nombreLocalizacion = item.nombreLocalizacion ?? ''
    form.idCiudad = item.idCiudad ?? ''
    form.direccionLocalizacion = item.direccionLocalizacion ?? ''
    form.telefonoContacto = item.telefonoContacto ?? ''
    form.correoContacto = item.correoContacto ?? ''
    form.horarioAtencion = item.horarioAtencion ?? ''
    form.zonaHoraria = item.zonaHoraria ?? 'America/Guayaquil'
    form.estadoLocalizacion = item.estadoLocalizacion ?? 'ACT'
  }

  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingItem.value = null
  resetForm()
}

async function submitForm() {
  isSubmitting.value = true
  resetMessages()

  try {
    const username = authStore.user?.username ?? 'admin'

    if (selectedCatalog.value === 'roles') {
      if (form.id) {
        await actualizarRol(form.id, {
          idRol: Number(form.id),
          nombreRol: form.nombreRol,
          descripcionRol: form.descripcionRol,
          estadoRol: form.estadoRol,
          activo: form.estadoRol === 'ACT',
          modificadoPorUsuario: username,
        })
      } else {
        await crearRol({
          nombreRol: form.nombreRol,
          descripcionRol: form.descripcionRol,
          creadoPorUsuario: username,
        })
      }
    }

    if (selectedCatalog.value === 'marcas') {
      if (form.id) {
        await actualizarMarcaVehiculo(form.id, {
          idMarca: Number(form.id),
          nombreMarca: form.nombreMarca,
        })
      } else {
        await crearMarcaVehiculo({
          nombreMarca: form.nombreMarca,
        })
      }
    }

    if (selectedCatalog.value === 'categorias') {
      if (form.id) {
        await actualizarCategoriaVehiculo(form.id, {
          idCategoria: Number(form.id),
          nombreCategoria: form.nombreCategoria,
          descripcionCategoria: form.descripcionCategoria,
        })
      } else {
        await crearCategoriaVehiculo({
          nombreCategoria: form.nombreCategoria,
          descripcionCategoria: form.descripcionCategoria,
        })
      }
    }

    if (selectedCatalog.value === 'paises') {
      if (form.id) {
        await actualizarPais(form.id, {
          idPais: Number(form.id),
          nombrePais: form.nombrePais,
        })
      } else {
        await crearPais({
          nombrePais: form.nombrePais,
        })
      }
    }

    if (selectedCatalog.value === 'ciudades') {
      if (form.id) {
        await actualizarCiudad(form.id, {
          idCiudad: Number(form.id),
          nombreCiudad: form.nombreCiudad,
          idPais: Number(form.idPais),
        })
      } else {
        await crearCiudad({
          nombreCiudad: form.nombreCiudad,
          idPais: Number(form.idPais),
        })
      }
    }

    if (selectedCatalog.value === 'localizaciones') {
      if (form.id) {
        await actualizarLocalizacion(form.id, {
          idLocalizacion: Number(form.id),
          nombreLocalizacion: form.nombreLocalizacion,
          idCiudad: Number(form.idCiudad),
          direccionLocalizacion: form.direccionLocalizacion,
          telefonoContacto: form.telefonoContacto,
          correoContacto: form.correoContacto,
          horarioAtencion: form.horarioAtencion,
          zonaHoraria: form.zonaHoraria,
          estadoLocalizacion: form.estadoLocalizacion,
          modificadoPorUsuario: username,
        })
      } else {
        await crearLocalizacion({
          nombreLocalizacion: form.nombreLocalizacion,
          idCiudad: Number(form.idCiudad),
          direccionLocalizacion: form.direccionLocalizacion,
          telefonoContacto: form.telefonoContacto,
          correoContacto: form.correoContacto,
          horarioAtencion: form.horarioAtencion,
          zonaHoraria: form.zonaHoraria,
          creadoPorUsuario: username,
          origenRegistro: 'web',
        })
      }
    }

    successMessage.value = `${currentMeta.value?.title || 'Registro'} guardado correctamente.`
    closeForm()
    await loadCatalogs()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo guardar el registro.'
  } finally {
    isSubmitting.value = false
  }
}

async function inactivateItem(item) {
  resetMessages()

  try {
    if (selectedCatalog.value === 'roles') await inactivarRol(item.idRol)
    if (selectedCatalog.value === 'marcas') await inactivarMarcaVehiculo(item.idMarca)
    if (selectedCatalog.value === 'categorias') await inactivarCategoriaVehiculo(item.idCategoria)
    if (selectedCatalog.value === 'paises') await inactivarPais(item.idPais)
    if (selectedCatalog.value === 'ciudades') await inactivarCiudad(item.idCiudad)
    if (selectedCatalog.value === 'localizaciones') await inactivarLocalizacion(item.idLocalizacion)

    successMessage.value = `${currentMeta.value?.title || 'Registro'} inactivado correctamente.`
    await loadCatalogs()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo inactivar el registro.'
  }
}

function itemTitle(item) {
  if (selectedCatalog.value === 'roles') return item.nombreRol
  if (selectedCatalog.value === 'marcas') return item.nombreMarca
  if (selectedCatalog.value === 'categorias') return item.nombreCategoria
  if (selectedCatalog.value === 'paises') return item.nombrePais
  if (selectedCatalog.value === 'ciudades') return item.nombreCiudad
  if (selectedCatalog.value === 'localizaciones') return item.nombreLocalizacion
  return 'Registro'
}

function itemSubtitle(item) {
  if (selectedCatalog.value === 'roles') return item.descripcionRol || 'Sin descripcion'
  if (selectedCatalog.value === 'marcas') return `ID: ${item.idMarca}`
  if (selectedCatalog.value === 'categorias') return item.descripcionCategoria || 'Sin descripcion'
  if (selectedCatalog.value === 'paises') return `ID: ${item.idPais}`
  if (selectedCatalog.value === 'ciudades') return item.nombrePais || `Pais #${item.idPais}`
  if (selectedCatalog.value === 'localizaciones') return `${item.nombreCiudad || 'Sin ciudad'} · ${item.direccionLocalizacion || 'Sin direccion'}`
  return ''
}

function itemState(item) {
  if (selectedCatalog.value === 'roles') return item.estadoRol
  if (selectedCatalog.value === 'marcas') return item.estadoMarca
  if (selectedCatalog.value === 'categorias') return item.estadoCategoria
  if (selectedCatalog.value === 'paises') return item.estadoPais
  if (selectedCatalog.value === 'ciudades') return item.estadoCiudad
  if (selectedCatalog.value === 'localizaciones') return item.estadoLocalizacion
  return ''
}

function formTitle() {
  const entity = currentMeta.value?.title?.slice(0, -1) || 'Registro'
  return `${editingItem.value ? 'Editar' : 'Nuevo'} ${entity}`
}

onMounted(loadCatalogs)
</script>

<template>
  <section class="admin-page">
    <AdminPageHeader title="Configuracion" description="Catalogos y acciones administrativas del sistema" />

    <p v-if="errorMessage" class="admin-state-message admin-state-message--error">{{ errorMessage }}</p>
    <p v-else-if="successMessage" class="admin-state-message admin-state-message--success">{{ successMessage }}</p>
    <p v-else-if="isLoading" class="admin-state-message">Cargando configuracion...</p>

    <div class="config-grid">
      <article v-for="card in cards" :key="card.key" class="admin-card config-card">
        <div class="config-card__icon">
          <component :is="card.icon" :size="22" />
        </div>
        <div class="config-card__content">
          <div>
            <h2>{{ card.title }}</h2>
            <p>{{ card.description }}</p>
          </div>
          <strong>{{ card.count }} registros</strong>
        </div>
        <button type="button" class="admin-button" @click="openManager(card.key)">Administrar</button>
      </article>
    </div>

    <AdminModal
      v-if="managerOpen && currentMeta"
      :title="`Administrar ${currentMeta.title}`"
      size="xl"
      @close="closeManager"
    >
      <div class="config-manager">
        <div class="config-manager__toolbar">
          <AdminSearchBar v-model="managerSearch" :placeholder="`Buscar en ${currentMeta.title.toLowerCase()}...`" />
          <button type="button" class="admin-button" @click="openCreateForm">
            <Plus :size="18" />
            <span>Nuevo</span>
          </button>
        </div>

        <div v-if="filteredItems.length" class="config-manager__list">
          <article v-for="item in filteredItems" :key="JSON.stringify(item)" class="admin-card config-record">
            <div>
              <h3>{{ itemTitle(item) }}</h3>
              <p>{{ itemSubtitle(item) }}</p>
            </div>

            <div class="config-record__actions">
              <AdminStatusBadge v-bind="activeStateMeta(itemState(item))" />
              <button type="button" class="admin-icon-button" title="Editar" @click="openEditForm(item)">
                <Pencil :size="17" />
              </button>
              <button
                v-if="itemState(item) === 'ACT'"
                type="button"
                class="admin-icon-button admin-icon-button--danger"
                title="Inactivar"
                @click="inactivateItem(item)"
              >
                <Trash2 :size="17" />
              </button>
            </div>
          </article>
        </div>

        <AdminEmptyState
          v-else
          :title="`No hay registros en ${currentMeta.title}`"
          description="Crea el primer registro de este catalogo."
        />
      </div>
    </AdminModal>

    <AdminModal
      v-if="formOpen && currentMeta"
      :title="formTitle()"
      size="lg"
      @close="closeForm"
    >
      <form class="admin-form" @submit.prevent="submitForm">
        <template v-if="selectedCatalog === 'roles'">
          <div class="admin-field">
            <label>Nombre del rol *</label>
            <input v-model="form.nombreRol" required />
          </div>
          <div class="admin-field">
            <label>Descripcion *</label>
            <textarea v-model="form.descripcionRol" required />
          </div>
          <div v-if="editingItem" class="admin-field">
            <label>Estado *</label>
            <select v-model="form.estadoRol">
              <option value="ACT">Activo</option>
              <option value="INA">Inactivo</option>
            </select>
          </div>
        </template>

        <template v-else-if="selectedCatalog === 'marcas'">
          <div class="admin-field">
            <label>Nombre de la marca *</label>
            <input v-model="form.nombreMarca" required />
          </div>
        </template>

        <template v-else-if="selectedCatalog === 'categorias'">
          <div class="admin-field">
            <label>Nombre de la categoria *</label>
            <input v-model="form.nombreCategoria" required />
          </div>
          <div class="admin-field">
            <label>Descripcion *</label>
            <textarea v-model="form.descripcionCategoria" required />
          </div>
        </template>

        <template v-else-if="selectedCatalog === 'paises'">
          <div class="admin-field">
            <label>Nombre del pais *</label>
            <input v-model="form.nombrePais" required />
          </div>
        </template>

        <template v-else-if="selectedCatalog === 'ciudades'">
          <div class="admin-grid admin-grid--2">
            <div class="admin-field">
              <label>Nombre de la ciudad *</label>
              <input v-model="form.nombreCiudad" required />
            </div>
            <div class="admin-field">
              <label>Pais *</label>
              <select v-model="form.idPais" required>
                <option value="">Seleccionar pais...</option>
                <option v-for="pais in countryOptions" :key="pais.idPais" :value="pais.idPais">{{ pais.nombrePais }}</option>
              </select>
            </div>
          </div>
        </template>

        <template v-else-if="selectedCatalog === 'localizaciones'">
          <div class="admin-grid admin-grid--2">
            <div class="admin-field">
              <label>Nombre *</label>
              <input v-model="form.nombreLocalizacion" required />
            </div>
            <div class="admin-field">
              <label>Ciudad *</label>
              <select v-model="form.idCiudad" required>
                <option value="">Seleccionar ciudad...</option>
                <option v-for="ciudad in cityOptions" :key="ciudad.idCiudad" :value="ciudad.idCiudad">
                  {{ ciudad.nombreCiudad }} · {{ ciudad.nombrePais || `Pais #${ciudad.idPais}` }}
                </option>
              </select>
            </div>
          </div>

          <div class="admin-field">
            <label>Direccion *</label>
            <textarea v-model="form.direccionLocalizacion" required />
          </div>

          <div class="admin-grid admin-grid--2">
            <div class="admin-field">
              <label>Telefono *</label>
              <input v-model="form.telefonoContacto" required />
            </div>
            <div class="admin-field">
              <label>Correo *</label>
              <input v-model="form.correoContacto" type="email" required />
            </div>
          </div>

          <div class="admin-grid admin-grid--2">
            <div class="admin-field">
              <label>Horario de atencion *</label>
              <input v-model="form.horarioAtencion" placeholder="08:00-18:00" required />
            </div>
            <div class="admin-field">
              <label>Zona horaria *</label>
              <input v-model="form.zonaHoraria" required />
            </div>
          </div>

          <div v-if="editingItem" class="admin-field">
            <label>Estado *</label>
            <select v-model="form.estadoLocalizacion">
              <option value="ACT">Activo</option>
              <option value="INA">Inactivo</option>
            </select>
          </div>
        </template>
      </form>

      <template #footer>
        <button type="button" class="admin-button--secondary" @click="closeForm">Cancelar</button>
        <button type="button" class="admin-button" :disabled="isSubmitting" @click="submitForm">
          {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
        </button>
      </template>
    </AdminModal>
  </section>
</template>

<style scoped>
.config-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.config-card {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
}

.config-card__icon {
  display: grid;
  height: 3.25rem;
  width: 3.25rem;
  place-items: center;
  border-radius: 1rem;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.config-card__content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.config-card h2,
.config-card p,
.config-card strong,
.config-record h3,
.config-record p {
  margin: 0;
}

.config-card p,
.config-record p {
  color: var(--color-text-muted);
}

.config-manager {
  display: grid;
  gap: 1rem;
}

.config-manager__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
}

.config-manager__list {
  display: grid;
  gap: 0.9rem;
}

.config-record {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.2rem;
}

.config-record__actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

@media (max-width: 960px) {
  .config-grid,
  .config-manager__toolbar {
    grid-template-columns: 1fr;
  }

  .config-card__content,
  .config-record {
    flex-direction: column;
    align-items: flex-start;
  }

  .config-record__actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
