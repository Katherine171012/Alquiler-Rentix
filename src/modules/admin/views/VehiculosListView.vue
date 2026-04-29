<script setup>
import { computed, onMounted, ref } from 'vue'
import { CarFront, Eye, ImageUp, Pencil, Plus, Settings2, ToggleLeft, ToggleRight } from 'lucide-vue-next'
import { useAuthStore } from '../../../stores/auth.store'
import { listarCategoriasVehiculo } from '../../../api/categoriasVehiculo.api'
import { listarLocalizaciones } from '../../../api/localizaciones.api'
import { listarMarcasVehiculo } from '../../../api/marcasVehiculo.api'
import {
  activarVehiculo,
  actualizarVehiculo,
  crearVehiculo,
  inactivarVehiculo,
  listarVehiculos,
  marcarVehiculoDisponible,
  marcarVehiculoMantenimiento,
  obtenerVehiculo,
} from '../../../api/vehiculos.api'
import { AdminEmptyState, AdminModal, AdminPageHeader, AdminSearchBar, AdminStatusBadge } from '../components'
import { formatCurrency, getItems, vehiculoNombre, vehicleStateMeta } from '../utils/panel'
import { subirImagenVehiculoCloudinary } from '../../../utils/cloudinary'
import { construirUrlImagenVehiculo } from '../../../utils/imagenesVehiculo'

const authStore = useAuthStore()
const isLoading = ref(true)
const isSubmitting = ref(false)
const isUploadingImage = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchTerm = ref('')
const vehiculos = ref([])
const marcas = ref([])
const categorias = ref([])
const localizaciones = ref([])
const selectedVehiculo = ref(null)
const activeModal = ref('')
const form = ref(createVehiculoForm())
const imageFile = ref(null)

function createVehiculoForm() {
  return {
    idVehiculo: '',
    placaVehiculo: '',
    imagenVehiculo: '',
    codigoInternoVehiculo: '',
    idMarca: '',
    idCategoria: '',
    localizacionActual: '',
    modeloVehiculo: '',
    anioFabricacion: new Date().getFullYear(),
    colorVehiculo: '',
    tipoCombustible: 'Gasolina',
    tipoTransmision: 'Automatica',
    capacidadPasajeros: 5,
    capacidadMaletas: 2,
    numeroPuertas: 4,
    precioBaseDia: 0,
    kilometrajeActual: 0,
  }
}

const marcaMap = computed(() => Object.fromEntries(marcas.value.map((item) => [item.idMarca, item.nombreMarca])))
const categoriaMap = computed(() => Object.fromEntries(categorias.value.map((item) => [item.idCategoria, item.nombreCategoria])))
const localizacionMap = computed(() =>
  Object.fromEntries(localizaciones.value.map((item) => [item.idLocalizacion, item.nombreLocalizacion])),
)

const filteredVehiculos = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return vehiculos.value

  return vehiculos.value.filter((vehiculo) => {
    const haystack = [
      vehiculoNombre(vehiculo),
      vehiculo.placaVehiculo,
      marcaMap.value[vehiculo.idMarca],
      categoriaMap.value[vehiculo.idCategoria],
      localizacionMap.value[vehiculo.localizacionActual],
      vehicleStateMeta(vehiculo.estadoVehiculo).label,
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

async function loadVehiculos() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [vehiculosResponse, marcasResponse, categoriasResponse, localizacionesResponse] = await Promise.all([
      listarVehiculos(),
      listarMarcasVehiculo(),
      listarCategoriasVehiculo(),
      listarLocalizaciones(),
    ])

    vehiculos.value = getItems(vehiculosResponse.data)
    marcas.value = getItems(marcasResponse.data)
    categorias.value = getItems(categoriasResponse.data)
    localizaciones.value = getItems(localizacionesResponse.data)
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudieron cargar los vehiculos.'
  } finally {
    isLoading.value = false
  }
}

async function openDetail(idVehiculo) {
  try {
    const response = await obtenerVehiculo(idVehiculo)
    selectedVehiculo.value = response.data
    activeModal.value = 'detail'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo cargar el vehiculo.'
  }
}

async function openEdit(idVehiculo) {
  try {
    const response = await obtenerVehiculo(idVehiculo)
    const vehiculo = response.data
    selectedVehiculo.value = vehiculo
    form.value = {
      idVehiculo: vehiculo.idVehiculo,
      placaVehiculo: vehiculo.placaVehiculo ?? '',
      imagenVehiculo: vehiculo.imagenVehiculo ?? '',
      codigoInternoVehiculo: vehiculo.codigoInternoVehiculo ?? '',
      idMarca: vehiculo.idMarca ?? '',
      idCategoria: vehiculo.idCategoria ?? '',
      localizacionActual: vehiculo.localizacionActual ?? '',
      modeloVehiculo: vehiculo.modeloVehiculo ?? '',
      anioFabricacion: vehiculo['añoFabricacion'] ?? new Date().getFullYear(),
      colorVehiculo: vehiculo.colorVehiculo ?? '',
      tipoCombustible: vehiculo.tipoCombustible ?? 'Gasolina',
      tipoTransmision: vehiculo.tipoTransmision ?? 'Automatica',
      capacidadPasajeros: vehiculo.capacidadPasajeros ?? 5,
      capacidadMaletas: vehiculo.capacidadMaletas ?? 2,
      numeroPuertas: vehiculo.numeroPuertas ?? 4,
      precioBaseDia: vehiculo.precioBaseDia ?? 0,
      kilometrajeActual: vehiculo.kilometrajeActual ?? 0,
    }
    activeModal.value = 'form'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo cargar el vehiculo.'
  }
}

function closeModal() {
  activeModal.value = ''
  selectedVehiculo.value = null
  imageFile.value = null
  form.value = createVehiculoForm()
}

function onImageSelected(event) {
  const [file] = event.target.files ?? []
  imageFile.value = file ?? null
}

async function uploadImage() {
  resetMessages()

  if (!imageFile.value) {
    errorMessage.value = 'Selecciona una imagen antes de subirla.'
    return
  }

  if (!form.value.placaVehiculo) {
    errorMessage.value = 'Primero ingresa la placa del vehiculo para asociar la imagen.'
    return
  }

  isUploadingImage.value = true

  try {
    const result = await subirImagenVehiculoCloudinary(imageFile.value, form.value.placaVehiculo)
    form.value.imagenVehiculo = result.secure_url ?? ''
    successMessage.value = 'Imagen subida correctamente.'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo subir la imagen.'
  } finally {
    isUploadingImage.value = false
  }
}

async function submitVehiculo() {
  isSubmitting.value = true
  resetMessages()

  try {
    const payload = {
      placaVehiculo: form.value.placaVehiculo,
      imagenVehiculo: form.value.imagenVehiculo || null,
      codigoInternoVehiculo: form.value.codigoInternoVehiculo,
      idMarca: Number(form.value.idMarca),
      idCategoria: Number(form.value.idCategoria),
      localizacionActual: Number(form.value.localizacionActual),
      modeloVehiculo: form.value.modeloVehiculo,
      'añoFabricacion': Number(form.value.anioFabricacion),
      colorVehiculo: form.value.colorVehiculo,
      tipoCombustible: form.value.tipoCombustible,
      tipoTransmision: form.value.tipoTransmision,
      capacidadPasajeros: Number(form.value.capacidadPasajeros),
      capacidadMaletas: Number(form.value.capacidadMaletas),
      numeroPuertas: Number(form.value.numeroPuertas),
      precioBaseDia: Number(form.value.precioBaseDia),
      kilometrajeActual: Number(form.value.kilometrajeActual),
    }

    if (form.value.idVehiculo) {
      await actualizarVehiculo(form.value.idVehiculo, {
        idVehiculo: Number(form.value.idVehiculo),
        ...payload,
        estadoVehiculo: selectedVehiculo.value?.estadoVehiculo ?? 'DIS',
      })
      successMessage.value = 'Vehiculo actualizado correctamente.'
    } else {
      await crearVehiculo({
        ...payload,
        creadoPorUsuario: authStore.user?.username ?? 'admin',
        origenRegistro: 'PANEL_ADMIN',
      })
      successMessage.value = 'Vehiculo creado correctamente.'
    }

    closeModal()
    await loadVehiculos()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo guardar el vehiculo.'
  } finally {
    isSubmitting.value = false
  }
}

async function changeStatus(action, idVehiculo) {
  resetMessages()
  try {
    if (action === 'activate') await activarVehiculo(idVehiculo)
    if (action === 'inactivate') await inactivarVehiculo(idVehiculo)
    if (action === 'maintenance') await marcarVehiculoMantenimiento(idVehiculo)
    if (action === 'available') await marcarVehiculoDisponible(idVehiculo)

    successMessage.value = 'Estado del vehiculo actualizado.'
    await loadVehiculos()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo actualizar el estado del vehiculo.'
  }
}

onMounted(loadVehiculos)
</script>

<template>
  <section class="admin-page">
    <AdminPageHeader title="Vehiculos" description="Gestion de flota y disponibilidad">
      <button type="button" class="admin-button" @click="activeModal = 'form'">
        <Plus :size="18" />
        <span>Nuevo Vehiculo</span>
      </button>
    </AdminPageHeader>

    <p v-if="errorMessage" class="admin-state-message admin-state-message--error">{{ errorMessage }}</p>
    <p v-else-if="successMessage" class="admin-state-message admin-state-message--success">{{ successMessage }}</p>

    <div class="admin-card">
      <div class="admin-card__section">
        <AdminSearchBar v-model="searchTerm" placeholder="Buscar por modelo, marca, categoria o placa..." />
      </div>
    </div>

    <div v-if="isLoading" class="admin-state-message">Cargando vehiculos...</div>

    <div v-else-if="!filteredVehiculos.length" class="admin-card admin-card__section">
      <AdminEmptyState title="No hay vehiculos para mostrar" description="Crea un vehiculo nuevo o ajusta la busqueda." >
        <template #icon>
          <CarFront :size="26" />
        </template>
      </AdminEmptyState>
    </div>

    <div v-else class="vehiculos-grid">
      <article v-for="vehiculo in filteredVehiculos" :key="vehiculo.idVehiculo" class="admin-card vehiculo-card">
        <img class="vehiculo-card__image" :src="construirUrlImagenVehiculo(vehiculo.imagenVehiculo)" :alt="vehiculoNombre(vehiculo)" />
        <div class="vehiculo-card__body">
          <div class="vehiculo-card__top">
            <div>
              <div class="admin-note">{{ categoriaMap[vehiculo.idCategoria] || 'Sin categoria' }}</div>
              <h2>{{ vehiculoNombre(vehiculo) }}</h2>
              <p>{{ vehiculo.placaVehiculo }} · {{ localizacionMap[vehiculo.localizacionActual] || 'Sin localizacion' }}</p>
            </div>
            <AdminStatusBadge v-bind="vehicleStateMeta(vehiculo.estadoVehiculo)" />
          </div>

          <div class="vehiculo-card__meta">
            <span>{{ vehiculo.capacidadPasajeros }} pasajeros</span>
            <span>{{ vehiculo.tipoTransmision }}</span>
            <span>{{ vehiculo.tipoCombustible }}</span>
          </div>

          <div class="vehiculo-card__footer">
            <strong>{{ formatCurrency(vehiculo.precioBaseDia) }}/dia</strong>
            <div class="admin-actions">
              <button type="button" class="admin-icon-button" title="Ver" @click="openDetail(vehiculo.idVehiculo)">
                <Eye :size="17" />
              </button>
              <button type="button" class="admin-icon-button" title="Editar" @click="openEdit(vehiculo.idVehiculo)">
                <Pencil :size="17" />
              </button>
              <button
                v-if="vehiculo.estadoVehiculo === 'INA'"
                type="button"
                class="admin-icon-button admin-icon-button--success"
                title="Activar"
                @click="changeStatus('activate', vehiculo.idVehiculo)"
              >
                <ToggleRight :size="17" />
              </button>
              <button
                v-else
                type="button"
                class="admin-icon-button admin-icon-button--danger"
                title="Inactivar"
                @click="changeStatus('inactivate', vehiculo.idVehiculo)"
              >
                <ToggleLeft :size="17" />
              </button>
              <button
                type="button"
                class="admin-icon-button"
                title="Mantenimiento"
                @click="changeStatus('maintenance', vehiculo.idVehiculo)"
              >
                <Settings2 :size="17" />
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>

    <AdminModal v-if="activeModal === 'form'" :title="form.idVehiculo ? 'Editar Vehiculo' : 'Nuevo Vehiculo'" size="lg" @close="closeModal">
      <form class="admin-form" @submit.prevent="submitVehiculo">
        <div class="admin-grid admin-grid--2">
          <div class="admin-field">
            <label>Placa *</label>
            <input v-model="form.placaVehiculo" :disabled="Boolean(form.idVehiculo)" required />
          </div>
          <div class="admin-field">
            <label>Codigo interno</label>
            <input v-model="form.codigoInternoVehiculo" />
          </div>
        </div>

        <div class="admin-grid admin-grid--2">
          <div class="admin-field">
            <label>URL de imagen</label>
            <input v-model="form.imagenVehiculo" placeholder="https://res.cloudinary.com/.../auto.jpg" />
          </div>
          <div class="admin-field">
            <label>Subir imagen a Cloudinary</label>
            <div class="vehiculo-upload">
              <input type="file" accept="image/*" @change="onImageSelected" />
              <button type="button" class="admin-button--secondary" :disabled="isUploadingImage" @click="uploadImage">
                <ImageUp :size="16" />
                <span>{{ isUploadingImage ? 'Subiendo...' : 'Subir imagen' }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="form.imagenVehiculo" class="vehiculo-preview">
          <img :src="construirUrlImagenVehiculo(form.imagenVehiculo)" alt="Vista previa del vehiculo" />
        </div>

        <div class="admin-grid admin-grid--3">
          <div class="admin-field">
            <label>Marca *</label>
            <select v-model="form.idMarca" required>
              <option value="">Seleccionar...</option>
              <option v-for="marca in marcas" :key="marca.idMarca" :value="marca.idMarca">{{ marca.nombreMarca }}</option>
            </select>
          </div>
          <div class="admin-field">
            <label>Categoria *</label>
            <select v-model="form.idCategoria" required>
              <option value="">Seleccionar...</option>
              <option v-for="categoria in categorias" :key="categoria.idCategoria" :value="categoria.idCategoria">
                {{ categoria.nombreCategoria }}
              </option>
            </select>
          </div>
          <div class="admin-field">
            <label>Localizacion *</label>
            <select v-model="form.localizacionActual" required>
              <option value="">Seleccionar...</option>
              <option v-for="localizacion in localizaciones" :key="localizacion.idLocalizacion" :value="localizacion.idLocalizacion">
                {{ localizacion.nombreLocalizacion }}
              </option>
            </select>
          </div>
        </div>

        <div class="admin-grid admin-grid--3">
          <div class="admin-field">
            <label>Modelo *</label>
            <input v-model="form.modeloVehiculo" required />
          </div>
          <div class="admin-field">
            <label>Año *</label>
            <input v-model="form.anioFabricacion" type="number" min="2000" required />
          </div>
          <div class="admin-field">
            <label>Color *</label>
            <input v-model="form.colorVehiculo" required />
          </div>
        </div>

        <div class="admin-grid admin-grid--3">
          <div class="admin-field">
            <label>Combustible *</label>
            <select v-model="form.tipoCombustible">
              <option value="Gasolina">Gasolina</option>
              <option value="Diesel">Diesel</option>
              <option value="Hibrido">Hibrido</option>
              <option value="Electrico">Electrico</option>
            </select>
          </div>
          <div class="admin-field">
            <label>Transmision *</label>
            <select v-model="form.tipoTransmision">
              <option value="Automatica">Automatica</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
          <div class="admin-field">
            <label>Precio base por dia *</label>
            <input v-model="form.precioBaseDia" type="number" min="0" step="0.01" required />
          </div>
        </div>

        <div class="admin-grid admin-grid--3">
          <div class="admin-field">
            <label>Pasajeros *</label>
            <input v-model="form.capacidadPasajeros" type="number" min="1" required />
          </div>
          <div class="admin-field">
            <label>Maletas *</label>
            <input v-model="form.capacidadMaletas" type="number" min="0" required />
          </div>
          <div class="admin-field">
            <label>Puertas *</label>
            <input v-model="form.numeroPuertas" type="number" min="2" required />
          </div>
        </div>

        <div class="admin-field">
          <label>Kilometraje actual *</label>
          <input v-model="form.kilometrajeActual" type="number" min="0" required />
        </div>
      </form>

      <template #footer>
        <button type="button" class="admin-button--secondary" @click="closeModal">Cancelar</button>
        <button type="button" class="admin-button" :disabled="isSubmitting" @click="submitVehiculo">
          {{ isSubmitting ? 'Guardando...' : 'Guardar Vehiculo' }}
        </button>
      </template>
    </AdminModal>

    <AdminModal v-if="activeModal === 'detail' && selectedVehiculo" title="Detalle del Vehiculo" size="lg" @close="closeModal">
      <div class="admin-detail-grid">
        <article class="admin-detail-card">
          <dl>
            <div><dt>Vehiculo</dt><dd>{{ vehiculoNombre(selectedVehiculo) }}</dd></div>
            <div><dt>Placa</dt><dd>{{ selectedVehiculo.placaVehiculo }}</dd></div>
            <div><dt>Codigo</dt><dd>{{ selectedVehiculo.codigoInternoVehiculo || '-' }}</dd></div>
          </dl>
        </article>

        <article class="admin-detail-card">
          <dl>
            <div><dt>Estado</dt><dd><AdminStatusBadge v-bind="vehicleStateMeta(selectedVehiculo.estadoVehiculo)" /></dd></div>
            <div><dt>Localizacion</dt><dd>{{ localizacionMap[selectedVehiculo.localizacionActual] || '-' }}</dd></div>
            <div><dt>Precio</dt><dd>{{ formatCurrency(selectedVehiculo.precioBaseDia) }}/dia</dd></div>
          </dl>
        </article>
      </div>

      <div v-if="selectedVehiculo.imagenVehiculo" class="vehiculo-detail-image">
        <img :src="construirUrlImagenVehiculo(selectedVehiculo.imagenVehiculo)" :alt="vehiculoNombre(selectedVehiculo)" />
      </div>
    </AdminModal>
  </section>
</template>

<style scoped>
.vehiculos-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.vehiculo-card {
  overflow: hidden;
}

.vehiculo-card__image {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: #f3f4f6;
}

.vehiculo-card__body {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.vehiculo-card__top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.vehiculo-card__top h2,
.vehiculo-card__top p {
  margin: 0;
}

.vehiculo-card__top p {
  margin-top: 0.35rem;
  color: var(--color-text-muted);
}

.vehiculo-card__meta,
.vehiculo-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.vehiculo-card__meta {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.vehiculo-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.vehiculo-upload input[type='file'] {
  min-height: auto;
  padding: 0;
  border: 0;
}

.vehiculo-preview,
.vehiculo-detail-image {
  overflow: hidden;
  border-radius: 1rem;
  background: #f3f4f6;
}

.vehiculo-preview img,
.vehiculo-detail-image img {
  width: 100%;
  max-height: 16rem;
  object-fit: cover;
}

.vehiculo-detail-image {
  margin-top: 1rem;
}

@media (max-width: 1200px) {
  .vehiculos-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .vehiculos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
