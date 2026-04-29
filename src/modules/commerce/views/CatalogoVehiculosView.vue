<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Fuel, Search, Settings2, UserRound } from 'lucide-vue-next'
import { consultarDisponibilidadVehiculos } from '../../../api/reservas.api'
import { consultarVehiculos } from '../../../api/vehiculos.api'
import { listarMarcasVehiculo } from '../../../api/marcasVehiculo.api'
import { listarCategoriasVehiculo } from '../../../api/categoriasVehiculo.api'
import { construirUrlImagenVehiculo } from '../../../utils/imagenesVehiculo'

const route = useRoute()
const cargando = ref(false)
const error = ref('')
const vehiculos = ref([])
const marcas = ref([])
const categorias = ref([])
const totalRegistros = ref(0)
const totalPaginas = ref(1)
const paginaActual = ref(1)
const tamanioPagina = ref(12)
const contextoDisponibilidad = ref(null)

const filtros = ref({
  parametro: '',
  idMarca: '',
  idCategoria: '',
  transmision: '',
  precioMaximo: 200,
})

const filtrados = computed(() => {
  const termino = filtros.value.parametro.trim().toLowerCase()

  return vehiculos.value.filter((vehiculo) => {
    if (Number(vehiculo.precioBaseDia ?? 0) > filtros.value.precioMaximo) return false
    if (filtros.value.idMarca && String(vehiculo.idMarca) !== String(filtros.value.idMarca)) return false
    if (filtros.value.idCategoria && String(vehiculo.idCategoria) !== String(filtros.value.idCategoria)) return false
    if (
      filtros.value.transmision &&
      String(vehiculo.tipoTransmision ?? '').toLowerCase() !== String(filtros.value.transmision).toLowerCase()
    ) {
      return false
    }

    if (!termino) return true

    const texto = [
      vehiculo.nombreMarca,
      vehiculo.modeloVehiculo,
      vehiculo.nombreCategoria,
      vehiculo.placaVehiculo,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return texto.includes(termino)
  })
})

async function cargarCatalogos() {
  const [resMarcas, resCategorias] = await Promise.all([
    listarMarcasVehiculo({ soloActivos: true, inactivosAlFinal: true }),
    listarCategoriasVehiculo({ soloActivos: true, inactivosAlFinal: true }),
  ])

  marcas.value = resMarcas?.data ?? []
  categorias.value = resCategorias?.data ?? []
}

async function cargarVehiculosFiltrados() {
  try {
    cargando.value = true
    error.value = ''
    if (contextoDisponibilidad.value?.idLocalizacion && contextoDisponibilidad.value?.fechaInicio && contextoDisponibilidad.value?.fechaFin) {
      const response = await consultarDisponibilidadVehiculos({
        idLocalizacion: Number(contextoDisponibilidad.value.idLocalizacion),
        fechaInicioUtc: new Date(contextoDisponibilidad.value.fechaInicio).toISOString(),
        fechaFinUtc: new Date(contextoDisponibilidad.value.fechaFin).toISOString(),
      })
      vehiculos.value = response?.data?.items ?? response?.data ?? []
      totalRegistros.value = vehiculos.value.length
      totalPaginas.value = 1
      paginaActual.value = 1
      return
    }

    const response = await consultarVehiculos({
      parametro: filtros.value.parametro || undefined,
      idMarca: filtros.value.idMarca || undefined,
      idCategoria: filtros.value.idCategoria || undefined,
      tipoTransmision: filtros.value.transmision || undefined,
      pageNumber: paginaActual.value,
      pageSize: tamanioPagina.value,
      soloActivos: true,
      inactivosAlFinal: true,
    })
    vehiculos.value = response?.data?.items ?? []
    totalRegistros.value = response?.data?.totalRecords ?? vehiculos.value.length
    totalPaginas.value = response?.data?.totalPages ?? 1
    paginaActual.value = response?.data?.pageNumber ?? paginaActual.value
  } catch (err) {
    error.value = err?.message ?? 'No se pudo cargar el catalogo'
  } finally {
    cargando.value = false
  }
}

function limpiarFiltros() {
  filtros.value = {
    parametro: '',
    idMarca: '',
    idCategoria: '',
    transmision: '',
    precioMaximo: 200,
  }
  paginaActual.value = 1
  cargarVehiculosFiltrados()
}

function aplicarFiltros() {
  paginaActual.value = 1
  cargarVehiculosFiltrados()
}

function irPaginaAnterior() {
  if (paginaActual.value <= 1 || cargando.value) return
  paginaActual.value -= 1
  cargarVehiculosFiltrados()
}

function irPaginaSiguiente() {
  if (paginaActual.value >= totalPaginas.value || cargando.value) return
  paginaActual.value += 1
  cargarVehiculosFiltrados()
}

async function inicializarCatalogo() {
  contextoDisponibilidad.value =
    route.query.idLocalizacion && route.query.fechaInicio && route.query.fechaFin
      ? {
          idLocalizacion: String(route.query.idLocalizacion),
          fechaInicio: String(route.query.fechaInicio),
          fechaFin: String(route.query.fechaFin),
        }
      : null

  try {
    await cargarCatalogos()
  } catch {
    // Si catalogos falla, el listado principal debe seguir disponible.
  }

  await cargarVehiculosFiltrados()
}

onMounted(inicializarCatalogo)

let debounceId = null
watch(
  () => [filtros.value.parametro, filtros.value.idMarca, filtros.value.idCategoria, filtros.value.transmision],
  () => {
    if (contextoDisponibilidad.value) return
    clearTimeout(debounceId)
    debounceId = setTimeout(() => {
      aplicarFiltros()
    }, 350)
  },
)
</script>

<template>
  <section class="catalogo">
    <header class="catalogo__hero">
      <div class="catalogo__inner">
        <span class="catalogo__eyebrow">Catalogo premium</span>
        <h1>Catalogo de vehiculos</h1>
        <p>Filtra por marca, categoria, transmision y precio para encontrar justo lo que necesitas.</p>
      </div>
    </header>

    <section class="filtros catalogo__inner">
      <h3>Filtros de busqueda</h3>
      <p v-if="contextoDisponibilidad" class="availability-note">
        Mostrando disponibilidad para la localizacion seleccionada entre {{ contextoDisponibilidad.fechaInicio }} y
        {{ contextoDisponibilidad.fechaFin }}.
      </p>
      <div class="filtros__grid">
        <div class="field">
          <label>Buscar por marca o modelo</label>
          <div class="input-icon">
            <Search :size="16" />
            <input v-model="filtros.parametro" type="text" placeholder="Ej: Toyota, Corolla, BMW..." />
          </div>
        </div>
        <div class="field">
          <label>Marca</label>
          <select v-model="filtros.idMarca">
            <option value="">Todas las marcas</option>
            <option v-for="marca in marcas" :key="marca.idMarca" :value="String(marca.idMarca)">
              {{ marca.marNombre ?? marca.nombreMarca ?? `Marca ${marca.idMarca}` }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Categoria</label>
          <select v-model="filtros.idCategoria">
            <option value="">Todas</option>
            <option
              v-for="categoria in categorias"
              :key="categoria.idCategoria"
              :value="String(categoria.idCategoria)"
            >
              {{ categoria.catNombre ?? categoria.nombreCategoria ?? `Categoria ${categoria.idCategoria}` }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Transmision</label>
          <select v-model="filtros.transmision">
            <option value="">Todas</option>
            <option value="Automatica">Automatica</option>
            <option value="Manual">Manual</option>
          </select>
        </div>
        <div class="field">
          <label>Precio maximo/dia: ${{ filtros.precioMaximo }}</label>
          <input v-model.number="filtros.precioMaximo" type="range" min="20" max="300" />
        </div>
      </div>
      <div class="filtros__meta">
        <span>{{ totalRegistros }} vehiculos encontrados</span>
        <button type="button" @click="limpiarFiltros">Limpiar filtros</button>
      </div>
    </section>

    <p v-if="cargando" class="feedback catalogo__inner">Cargando vehiculos...</p>
    <p v-else-if="error" class="feedback feedback--error catalogo__inner">{{ error }}</p>

    <section v-else class="grid catalogo__inner">
      <article v-for="vehiculo in filtrados" :key="vehiculo.idVehiculo" class="card">
        <img
          :src="construirUrlImagenVehiculo(vehiculo.imagenVehiculo)"
          :alt="`${vehiculo.nombreMarca} ${vehiculo.modeloVehiculo}`"
        />
        <div class="body">
          <small>{{ vehiculo.nombreCategoria }}</small>
          <h3>{{ vehiculo.nombreMarca }} {{ vehiculo.modeloVehiculo }}</h3>
          <small class="meta">
            <span>
              <UserRound :size="14" />
              {{ vehiculo.capacidadPasajeros || 5 }} pasajeros
            </span>
            <span>
              <Settings2 :size="14" />
              {{ vehiculo.tipoTransmision }}
            </span>
            <span>
              <Fuel :size="14" />
              {{ vehiculo.tipoCombustible }}
            </span>
          </small>
          <div class="card__footer">
            <strong>${{ vehiculo.precioBaseDia }}/dia</strong>
            <RouterLink :to="`/vehiculos/${vehiculo.idVehiculo}`">Ver detalles</RouterLink>
          </div>
        </div>
      </article>
    </section>

    <nav v-if="totalPaginas > 1" class="paginacion catalogo__inner">
      <button type="button" :disabled="paginaActual <= 1 || cargando" @click="irPaginaAnterior">
        Anterior
      </button>
      <span>Pagina {{ paginaActual }} de {{ totalPaginas }}</span>
      <button
        type="button"
        :disabled="paginaActual >= totalPaginas || cargando"
        @click="irPaginaSiguiente"
      >
        Siguiente
      </button>
    </nav>
  </section>
</template>

<style scoped>
.catalogo {
  display: grid;
  gap: 1.4rem;
  padding-bottom: 3rem;
  background:
    radial-gradient(circle at top, rgba(122, 20, 56, 0.08), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%);
}

.catalogo__inner {
  max-width: 1160px;
  margin: 0 auto;
  width: 100%;
  padding: 0 1rem;
}

.catalogo__hero {
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 30%),
    linear-gradient(120deg, #4d0d24, #6a1230 55%, #4a0b22 100%);
  color: #fff;
  padding: 4rem 0 9rem;
}

.catalogo__hero h1,
.catalogo__hero p {
  margin: 0;
}

.catalogo__eyebrow {
  display: inline-flex;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.catalogo__hero h1 {
  font-size: clamp(2.5rem, 5vw, 4.2rem);
  font-weight: 800;
  letter-spacing: -0.05em;
}

.catalogo__hero p {
  margin-top: 0.7rem;
  max-width: 760px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.05rem;
  line-height: 1.6;
}

.filtros {
  margin-top: -6rem;
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  background: #fff;
  padding: 1.5rem;
  box-shadow: var(--shadow-lg);
}

.filtros h3 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.filtros__grid {
  display: grid;
  grid-template-columns: 1.2fr repeat(3, 1fr) 1fr;
  gap: 1rem;
  margin-top: 1.25rem;
}

.field {
  display: grid;
  gap: 0.45rem;
}

.field > label {
  font-size: 0.82rem;
  color: var(--color-text);
  font-weight: 600;
}

.input-icon {
  position: relative;
}

.input-icon svg {
  position: absolute;
  left: 0.9rem;
  top: 1rem;
  color: var(--color-text-muted);
}

.input-icon input {
  width: 100%;
  padding-left: 2.6rem;
}

input,
select {
  border: 1px solid var(--color-border-strong);
  border-radius: 0.9rem;
  height: 3.25rem;
  padding: 0 0.95rem;
  background: #fff;
  font-size: 0.95rem;
  color: var(--color-text-soft);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(106, 18, 48, 0.1);
}

.field input[type='range'] {
  padding: 0;
  height: 2rem;
  accent-color: var(--color-primary);
}

.filtros__meta {
  margin-top: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.availability-note {
  margin: 0.85rem 0 0;
  color: var(--color-primary);
  font-size: 0.92rem;
  font-weight: 600;
}

button {
  border: 1px solid var(--color-border-strong);
  background: #fff;
  border-radius: 0.9rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text-soft);
}

.paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.paginacion button {
  min-width: 110px;
}

.paginacion button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.paginacion span {
  font-size: 0.95rem;
  color: var(--color-text-soft);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: 1.35rem;
  overflow: hidden;
  background: #fff;
  box-shadow: var(--shadow-md);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

img {
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.body {
  padding: 1.2rem;
}

.body small:first-child {
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.body h3 {
  margin: 0.4rem 0 0.7rem;
  font-size: 1.4rem;
  letter-spacing: -0.03em;
}

.meta {
  display: flex;
  gap: 0.8rem 1rem;
  flex-wrap: wrap;
}

.meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.92rem;
}

.meta svg {
  color: var(--color-text-muted);
}

.card__footer {
  margin-top: 1.1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.card__footer strong {
  font-size: 1.75rem;
  letter-spacing: -0.04em;
}

a {
  color: #fff;
  background: linear-gradient(135deg, #7b173b, #571027);
  text-decoration: none;
  border-radius: 0.85rem;
  padding: 0.78rem 1rem;
  font-weight: 700;
  font-size: 0.9rem;
}

.feedback {
  padding: 1rem;
  border-radius: 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--color-border);
  color: var(--color-text-soft);
}

.feedback--error {
  color: #991b1b;
}

@media (max-width: 980px) {
  .filtros__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .catalogo__hero h1 {
    font-size: 2.3rem;
  }
}

@media (max-width: 640px) {
  .catalogo__hero {
    padding: 3rem 0 7rem;
  }

  .filtros {
    margin-top: -4.5rem;
    padding: 1rem;
  }

  .filtros__grid,
  .grid {
    grid-template-columns: 1fr;
  }

  .filtros__meta,
  .card__footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
