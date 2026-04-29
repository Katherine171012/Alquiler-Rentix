<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Clock3, MapPin, Search, ShieldCheck } from 'lucide-vue-next'
import { consultarLocalizaciones } from '../../../api/localizaciones.api'
import { consultarDisponibilidadVehiculos } from '../../../api/reservas.api'
import { consultarVehiculos } from '../../../api/vehiculos.api'
import { construirUrlImagenVehiculo } from '../../../utils/imagenesVehiculo'

const router = useRouter()
const cargando = ref(false)
const error = ref('')
const vehiculos = ref([])
const cargandoLocalizaciones = ref(false)
const localizaciones = ref([])
const filtros = ref({
  ubicacion: '',
  fechaInicio: '',
  fechaFin: '',
})

const puedeBuscar = computed(
  () => Boolean(filtros.value.ubicacion && filtros.value.fechaInicio && filtros.value.fechaFin),
)

async function cargarVehiculos() {
  try {
    cargando.value = true
    error.value = ''
    const response = await consultarVehiculos({
      pageNumber: 1,
      pageSize: 3,
      soloActivos: true,
      inactivosAlFinal: true,
    })
    vehiculos.value = response?.data?.items ?? []
  } catch (err) {
    error.value = err?.message ?? 'No se pudo cargar el catalogo'
  } finally {
    cargando.value = false
  }
}

async function cargarLocalizacionesActivas() {
  try {
    cargandoLocalizaciones.value = true
    const response = await consultarLocalizaciones({
      soloActivos: true,
      pageNumber: 1,
      pageSize: 100,
    })
    localizaciones.value = response?.data?.items ?? []
  } finally {
    cargandoLocalizaciones.value = false
  }
}

async function buscarDisponibilidad() {
  if (!puedeBuscar.value) return

  try {
    cargando.value = true
    error.value = ''

    await consultarDisponibilidadVehiculos({
      idLocalizacion: Number(filtros.value.ubicacion),
      fechaInicioUtc: new Date(filtros.value.fechaInicio).toISOString(),
      fechaFinUtc: new Date(filtros.value.fechaFin).toISOString(),
    })

    await router.push({
      path: '/vehiculos',
      query: {
        idLocalizacion: filtros.value.ubicacion,
        fechaInicio: filtros.value.fechaInicio,
        fechaFin: filtros.value.fechaFin,
      },
    })
  } catch (err) {
    error.value = err?.message ?? 'No se pudo consultar la disponibilidad para esa localización.'
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  await Promise.all([cargarVehiculos(), cargarLocalizacionesActivas()])
})
</script>

<template>
  <section class="home">
    <header class="hero">
      <div class="hero__inner">
        <span class="hero__eyebrow">Rentix Autos Ecuador</span>
        <h1>Encuentra tu vehículo ideal</h1>
        <p>Reserva rápido, compara categorías y elige el auto perfecto para tu próximo viaje en Ecuador.</p>
        <form class="hero__search" @submit.prevent="buscarDisponibilidad">
          <label>
            Ubicación
            <select v-model="filtros.ubicacion" :disabled="cargandoLocalizaciones">
              <option value="">
                {{ cargandoLocalizaciones ? 'Cargando localizaciones...' : 'Selecciona una localizacion' }}
              </option>
              <option
                v-for="localizacion in localizaciones"
                :key="localizacion.idLocalizacion"
                :value="String(localizacion.idLocalizacion)"
              >
                {{ localizacion.nombreLocalizacion }} · {{ localizacion.nombreCiudad }}
              </option>
            </select>
          </label>
          <label>
            Fecha de recogida
            <input v-model="filtros.fechaInicio" type="date" />
          </label>
          <label>
            Fecha de entrega
            <input v-model="filtros.fechaFin" type="date" />
          </label>
          <button type="submit" class="hero__cta" :disabled="!puedeBuscar || cargando">
            {{ cargando ? 'Buscando...' : 'Buscar disponibilidad' }}
          </button>
        </form>
      </div>
    </header>

    <section class="benefits">
      <div class="benefits__inner">
        <article>
          <span class="icon-circle"><Search :size="14" /></span>
          <strong>Búsqueda fácil</strong>
          <small>Encuentra el auto ideal en segundos.</small>
        </article>
        <article>
          <span class="icon-circle"><ShieldCheck :size="14" /></span>
          <strong>Seguridad Total</strong>
          <small>Vehículos seguros y verificados.</small>
        </article>
        <article>
          <span class="icon-circle"><Clock3 :size="14" /></span>
          <strong>Disponibilidad 24/7</strong>
          <small>Reserva y recoge cuando quieras.</small>
        </article>
        <article>
          <span class="icon-circle"><MapPin :size="14" /></span>
          <strong>Múltiples ubicaciones</strong>
          <small>Oficinas en distintos puntos de Quito.</small>
        </article>
      </div>
    </section>

    <section class="featured">
      <div class="featured__inner">
        <h2>Vehículos destacados</h2>
        <p class="subtitle">Descubre nuestra selección de vehículos disponibles en Ecuador</p>
        <p v-if="cargando" class="feedback">Cargando vehículos...</p>
        <p v-else-if="error" class="feedback feedback--error">{{ error }}</p>

        <div v-else class="grid">
          <article v-for="vehiculo in vehiculos" :key="vehiculo.idVehiculo" class="card">
            <img
              :src="construirUrlImagenVehiculo(vehiculo.imagenVehiculo)"
              :alt="`${vehiculo.nombreMarca} ${vehiculo.modeloVehiculo}`"
            />
            <div class="body">
              <small>{{ vehiculo.nombreCategoria }}</small>
              <h3>{{ vehiculo.nombreMarca }} {{ vehiculo.modeloVehiculo }}</h3>
              <p class="car-meta">
                {{ vehiculo.tipoTransmision || 'Automatico' }} · {{ vehiculo.capacidadPasajeros || 5 }} pasajeros
              </p>
              <div class="card-row">
                <p>${{ vehiculo.precioBaseDia }}<span>/dia</span></p>
                <RouterLink :to="`/vehiculos/${vehiculo.idVehiculo}`">Reservar</RouterLink>
              </div>
            </div>
          </article>
        </div>
        <RouterLink class="more" to="/vehiculos">Ver todos los vehículos</RouterLink>
      </div>
    </section>

    <section class="cta">
      <div class="cta__inner">
        <h3>¿Listo para comenzar?</h3>
        <p>Reserva tu vehiculo hoy y disfruta de tarifas especiales</p>
        <RouterLink to="/vehiculos" class="cta__button">Reservar Ahora</RouterLink>
      </div>
    </section>
  </section>
</template>

<style scoped>
.home {
  display: grid;
  background:
    radial-gradient(circle at top, rgba(122, 20, 56, 0.08), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%);
}
.hero {
  min-height: 72vh;
  background-image:
    linear-gradient(rgba(65, 8, 26, 0.82), rgba(65, 8, 26, 0.7)),
    radial-gradient(circle at top, rgba(150, 34, 75, 0.28), transparent 40%),
    linear-gradient(120deg, #3f091b, #6a1230 58%, #4d0d24 100%);
  background-size: cover;
  background-position: center;
  color: #fff;
  padding: 4.5rem 1rem 3.25rem;
  display: flex;
  align-items: center;
}
.hero__inner {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  text-align: center;
}
.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  margin-bottom: 1.15rem;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.hero h1 {
  margin: 0;
  font-size: clamp(3rem, 6vw, 5rem);
  line-height: 0.98;
  font-weight: 800;
  letter-spacing: -0.05em;
  max-width: 900px;
  margin-inline: auto;
}
.hero p {
  margin: 1rem auto 2rem;
  max-width: 700px;
  color: rgba(255, 255, 255, 0.82);
  font-size: clamp(1rem, 2vw, 1.2rem);
}
.hero__search {
  margin: 0 auto;
  max-width: 1020px;
  background: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.6rem;
  padding: 1rem;
  display: grid;
  grid-template-columns: 1.25fr 0.9fr 0.9fr auto;
  gap: 0.85rem;
  box-shadow: var(--shadow-lg);
}
.hero__search label {
  display: grid;
  gap: 0.45rem;
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 600;
  text-align: left;
}
.hero__search input,
.hero__search select {
  border: 1px solid var(--color-border);
  border-radius: 0.95rem;
  height: 52px;
  padding: 0 0.95rem;
  font-size: 0.96rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.hero__search input:focus,
.hero__search select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(106, 18, 48, 0.1);
}
.hero__cta {
  border: none;
  background: linear-gradient(135deg, #7b173b, #571027);
  color: #fff;
  border-radius: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  min-width: 210px;
  padding: 0 1.3rem;
  font-size: 0.95rem;
  font-weight: 700;
  margin-top: 1.45rem;
  box-shadow: 0 14px 24px rgba(106, 18, 48, 0.24);
  cursor: pointer;
}
.hero__cta:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}
.benefits {
  padding: 2.8rem 1rem 2rem;
}
.benefits__inner {
  max-width: 1160px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}
.benefits article {
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 0.45rem;
  padding: 1.35rem 1rem;
  border-radius: 1.35rem;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: var(--shadow-sm);
}
.icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.benefits strong {
  font-size: 1.2rem;
}
.benefits small {
  font-size: 0.92rem;
  color: var(--color-text-muted);
}
.featured {
  padding: 2.75rem 1rem 4rem;
}
.featured__inner {
  max-width: 1160px;
  margin: 0 auto;
}
.featured h2 {
  text-align: center;
  margin: 0;
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: -0.04em;
}
.subtitle {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 1rem;
  margin: 0.6rem 0 2rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.2rem;
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
.body small {
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.body h3 {
  margin: 0.4rem 0 0.5rem;
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.car-meta {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}
.card-row {
  margin-top: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.card-row p {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.04em;
}
.card-row p span {
  font-size: 0.92rem;
  color: var(--color-text-muted);
  margin-left: 0.2rem;
}
.card-row a {
  text-decoration: none;
  background: linear-gradient(135deg, #7b173b, #571027);
  color: #fff;
  border-radius: 0.85rem;
  padding: 0.8rem 1.1rem;
  font-size: 0.92rem;
  font-weight: 700;
}
.more {
  display: block;
  margin-top: 1.4rem;
  text-align: center;
  color: var(--color-primary);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 700;
}
.cta {
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 35%),
    linear-gradient(120deg, #7b163a, #5b102c);
  padding: 5rem 1rem;
}
.cta__inner {
  max-width: 1160px;
  margin: 0 auto;
  text-align: center;
  color: #fff;
}
.cta h3 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.25rem);
  letter-spacing: -0.04em;
}
.cta p {
  margin: 0.75rem 0 1.5rem;
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.82);
}
.cta__button {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: var(--color-primary);
  border-radius: 1rem;
  padding: 1rem 1.4rem;
  font-size: 1rem;
  font-weight: 700;
}
.feedback {
  padding: 1rem;
  border-radius: 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--color-border);
  color: var(--color-text-soft);
}
.feedback--error {
  color: #991b1b;
}
@media (max-width: 900px) {
  .hero {
    min-height: 62vh;
    padding: 3rem 1rem 2.5rem;
  }
  .hero h1 {
    font-size: clamp(2.3rem, 4.4vw, 2.9rem);
  }
  .hero p {
    font-size: clamp(0.98rem, 2.2vw, 1.1rem);
  }
  .hero__search {
    grid-template-columns: 1fr 1fr;
    padding: 0.9rem;
  }
  .hero__cta {
    min-width: 0;
    width: 100%;
    margin-top: 1.25rem;
  }
  .benefits__inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .hero {
    min-height: auto;
  }
  .hero h1 {
    font-size: clamp(1.9rem, 7vw, 2.3rem);
  }
  .hero p {
    font-size: clamp(0.9rem, 3.5vw, 1rem);
  }
  .hero__search {
    grid-template-columns: 1fr;
    padding: 0.8rem;
    gap: 0.7rem;
  }
  .hero__search input {
    height: 48px;
    font-size: 0.9rem;
  }
  .hero__cta {
    height: 48px;
    font-size: 0.9rem;
  }
  .benefits__inner,
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
