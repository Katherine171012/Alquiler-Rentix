<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CalendarDays, Fuel, Settings2, UserRound } from 'lucide-vue-next'
import { obtenerVehiculo } from '../../../api/vehiculos.api'
import { verificarDisponibilidadVehiculo } from '../../../api/reservas.api'
import { construirUrlImagenVehiculo } from '../../../utils/imagenesVehiculo'
import { useReservaStore } from '../../../stores/reserva.store'

const route = useRoute()
const router = useRouter()
const reservaStore = useReservaStore()

const cargando = ref(false)
const error = ref('')
const vehiculo = ref(null)
const fechaInicio = ref('')
const fechaFin = ref('')
const fechaError = ref('')

const fechaHoy = computed(() => new Date().toISOString().slice(0, 10))

const titulo = computed(() => {
  if (!vehiculo.value) return 'Detalle del vehículo'
  return `${vehiculo.value.nombreMarca} ${vehiculo.value.modeloVehiculo}`
})

watch([fechaInicio, fechaFin], ([inicio, fin]) => {
  reservaStore.setFechas({ inicio: inicio || '', fin: fin || '' })
})

async function cargarDetalle() {
  try {
    cargando.value = true
    error.value = ''
    const response = await obtenerVehiculo(route.params.id)
    vehiculo.value = response?.data ?? null
  } catch (err) {
    error.value = err?.message ?? 'No se pudo cargar el detalle del vehículo.'
  } finally {
    cargando.value = false
  }
}

const verificandoDisponibilidad = ref(false)

async function reservarAhora() {
  fechaError.value = ''

  if (!fechaInicio.value || !fechaFin.value) {
    fechaError.value = 'Selecciona fecha de recogida y fecha de entrega.'
    return
  }
  if (fechaInicio.value < fechaHoy.value) {
    fechaError.value = 'La fecha de recogida no puede ser anterior a hoy.'
    return
  }
  if (fechaFin.value <= fechaInicio.value) {
    fechaError.value = 'La fecha de entrega debe ser posterior a la de recogida.'
    return
  }

  verificandoDisponibilidad.value = true
  try {
    const { disponible } = await verificarDisponibilidadVehiculo(
      vehiculo.value.idVehiculo,
      fechaInicio.value,
      fechaFin.value,
    )
    if (!disponible) {
      fechaError.value = 'Este vehículo ya tiene una reserva en las fechas seleccionadas. Por favor elige otras fechas.'
      return
    }
  } catch {
    // Si falla la verificación, permitir continuar
  } finally {
    verificandoDisponibilidad.value = false
  }

  reservaStore.setVehiculoSeleccionado(vehiculo.value)
  reservaStore.setFechas({ inicio: fechaInicio.value, fin: fechaFin.value })
  router.push({ path: '/reserva/datos', query: { idVehiculo: vehiculo.value.idVehiculo } })
}

onMounted(async () => {
  await cargarDetalle()

  const qInicio = route.query.fechaInicio
  const qFin = route.query.fechaFin

  if (qInicio || reservaStore.fechaInicio) {
    fechaInicio.value = qInicio || reservaStore.fechaInicio
  }
  if (qFin || reservaStore.fechaFin) {
    fechaFin.value = qFin || reservaStore.fechaFin
  }
})
</script>

<template>
  <section class="detalle">
    <div class="detalle__hero">
      <div class="detalle__hero-inner">
        <p class="detalle__back">
          <RouterLink to="/vehiculos">
            <ArrowLeft :size="16" />
            Volver al catálogo
          </RouterLink>
        </p>
      </div>
    </div>

    <div class="detalle__inner">
      <p v-if="cargando" class="feedback">Cargando vehículo...</p>
      <p v-else-if="error" class="feedback feedback--error">{{ error }}</p>

      <template v-else-if="vehiculo">
        <article class="detalle__top">
          <img :src="construirUrlImagenVehiculo(vehiculo.imagenVehiculo)" :alt="titulo" />

          <aside class="reserva-box">
            <small class="reserva-box__label">Precio por día</small>
            <h3>${{ vehiculo.precioBaseDia }}</h3>
            <span>+ impuestos y cargos</span>

            <div v-if="fechaError" class="reserva-box__error">
              {{ fechaError }}
            </div>

            <label class="reserva-box__field">
              <span class="reserva-box__field-label">Fecha de recogida</span>
              <div class="reserva-box__field-input" :class="{ 'reserva-box__field-input--error': fechaError && !fechaInicio }">
                <CalendarDays :size="18" />
                <input v-model="fechaInicio" type="date" :min="fechaHoy" />
              </div>
            </label>
            <label class="reserva-box__field">
              <span class="reserva-box__field-label">Fecha de entrega</span>
              <div class="reserva-box__field-input" :class="{ 'reserva-box__field-input--error': fechaError && !fechaFin }">
                <CalendarDays :size="18" />
                <input v-model="fechaFin" type="date" :min="fechaInicio || fechaHoy" />
              </div>
            </label>
            <button
              type="button"
              class="reserva-btn w-100"
              :disabled="verificandoDisponibilidad"
              @click="reservarAhora"
            >
              {{ verificandoDisponibilidad ? 'Verificando disponibilidad...' : 'Reservar ahora' }}
            </button>
            <small class="reserva-box__note">Cancelación gratuita hasta 24 horas antes</small>
          </aside>
        </article>

        <article class="detalle__info">
          <div class="detalle__heading">
            <div>
              <small>{{ vehiculo.nombreCategoria }}</small>
              <h2>{{ titulo }}</h2>
              <p>{{ vehiculo.nombreMarca }} · {{ vehiculo.añoFabricacion }}</p>
            </div>
            <span class="estado">Disponible</span>
          </div>

          <p class="detalle__description">
            Vehículo cómodo y eficiente, ideal para viajes de negocios, recorridos en Quito o escapadas de fin de semana.
          </p>

          <div class="meta-grid">
            <div class="meta-card">
              <span class="meta-card__icon"><UserRound :size="20" /></span>
              <div class="meta-card__text">
                <small>Capacidad</small>
                <strong>{{ vehiculo.capacidadPasajeros }} personas</strong>
              </div>
            </div>
            <div class="meta-card">
              <span class="meta-card__icon"><Settings2 :size="20" /></span>
              <div class="meta-card__text">
                <small>Transmision</small>
                <strong>{{ vehiculo.tipoTransmision }}</strong>
              </div>
            </div>
            <div class="meta-card">
              <span class="meta-card__icon"><Fuel :size="20" /></span>
              <div class="meta-card__text">
                <small>Combustible</small>
                <strong>{{ vehiculo.tipoCombustible }}</strong>
              </div>
            </div>
            <div class="meta-card">
              <span class="meta-card__icon"><CalendarDays :size="20" /></span>
              <div class="meta-card__text">
                <small>Año</small>
                <strong>{{ vehiculo.añoFabricacion }}</strong>
              </div>
            </div>
          </div>
        </article>

        <article class="incluye">
          <h3>Características incluidas</h3>
          <ul>
            <li>Aire acondicionado</li>
            <li>Sistema de audio premium</li>
            <li>Bluetooth</li>
            <li>Control de crucero</li>
            <li>Camara de reversa</li>
            <li>Bolsas de aire</li>
            <li>Frenos ABS</li>
            <li>Seguro basico incluido</li>
          </ul>
        </article>
      </template>
    </div>
  </section>
</template>

<style scoped>
.detalle {
  display: grid;
  background:
    radial-gradient(circle at top, rgba(122, 20, 56, 0.08), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%);
}

.detalle__hero {
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 28%),
    linear-gradient(120deg, #4d0d24, #6a1230 55%, #4a0b22 100%);
  min-height: 140px;
}

.detalle__hero-inner,
.detalle__inner {
  width: 100%;
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 1rem;
}

.detalle__inner {
  display: grid;
  gap: 1.5rem;
  margin-top: -4rem;
  padding-bottom: 3rem;
}

.detalle__back {
  margin: 0;
  padding-top: 2rem;
}

.detalle__back a {
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  text-decoration: none;
  font-weight: 600;
}

.detalle__top {
  display: grid;
  grid-template-columns: 1.7fr 0.85fr;
  gap: 1.5rem;
  align-items: start;
}

img {
  width: 100%;
  border-radius: 1.6rem;
  object-fit: cover;
  min-height: 500px;
  box-shadow: var(--shadow-lg);
}

.reserva-box {
  border: 1px solid var(--color-border);
  border-radius: 1.6rem;
  background: rgba(255, 255, 255, 0.96);
  padding: 1.6rem;
  display: grid;
  gap: 0.75rem;
  align-content: start;
  box-shadow: var(--shadow-md);
}

.reserva-box__label {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.reserva-box h3 {
  margin: 0;
  font-size: 3.25rem;
  line-height: 0.95;
  letter-spacing: -0.05em;
}

.reserva-box span {
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

label {
  display: grid;
  gap: 0.45rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  margin-top: 0.4rem;
}

input {
  border: 1px solid var(--color-border-strong);
  border-radius: 0.95rem;
  height: 3.2rem;
  padding: 0 0.9rem;
  font-size: 0.95rem;
}

input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(106, 18, 48, 0.1);
}

.reserva-btn {
  margin-top: 0.75rem;
  text-decoration: none;
  background: linear-gradient(135deg, #7b173b, #571027);
  color: #fff;
  border-radius: 1rem;
  height: 3.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  box-shadow: 0 14px 26px rgba(106, 18, 48, 0.24);
}

.reserva-box__note {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.88rem;
  margin-top: 0.2rem;
}

.reserva-box__error {
  padding: 0.65rem 0.9rem;
  border-radius: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 0.88rem;
  margin-bottom: 0.4rem;
}

.reserva-box__field {
  display: grid;
  gap: 0.4rem;
  margin-top: 0.6rem;
}

.reserva-box__field-label {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-text);
}

.reserva-box__field-input {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  height: 3.2rem;
  padding: 0 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.95rem;
  background: #fff;
}

.reserva-box__field-input svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.reserva-box__field-input input {
  flex: 1;
  border: none;
  height: auto;
  padding: 0;
  margin: 0;
  background: transparent;
  outline: none;
  box-shadow: none;
}

.reserva-box__field-input:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(106, 18, 48, 0.1);
}

.reserva-box__field-input--error {
  border-color: #b42318;
  box-shadow: 0 0 0 3px rgba(180, 35, 24, 0.1);
}

.detalle__info,
.incluye {
  border: 1px solid var(--color-border);
  border-radius: 1.6rem;
  padding: 1.6rem;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--shadow-md);
}

.detalle__heading {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
}

.detalle__heading small {
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.detalle__heading h2 {
  margin: 0.35rem 0;
  font-size: clamp(2rem, 4vw, 3.25rem);
  letter-spacing: -0.05em;
}

.detalle__heading p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 1.05rem;
}

.estado {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  font-weight: 700;
  white-space: nowrap;
}

.detalle__description {
  margin: 1.1rem 0 0;
  color: var(--color-text-soft);
  font-size: 1.05rem;
  line-height: 1.7;
}

.meta-grid {
  margin-top: 1.6rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

.meta-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.7rem;
  padding: 1.25rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 1.1rem;
  background: var(--color-surface-muted);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.meta-card:hover {
  border-color: rgba(106, 18, 48, 0.2);
  box-shadow: 0 4px 16px rgba(106, 18, 48, 0.06);
}

.meta-card__icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.85rem;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  flex-shrink: 0;
}

.meta-card__text small {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.meta-card__text strong {
  display: block;
  font-size: 1rem;
  color: var(--color-text);
  font-weight: 700;
}

.incluye h3 {
  margin: 0 0 1.2rem;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
}

.incluye ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem 1.4rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.incluye li {
  position: relative;
  padding-left: 1.5rem;
  color: var(--color-text);
}

.incluye li::before {
  content: '✓';
  position: absolute;
  left: 0;
  top: 0;
  color: #16a34a;
  font-weight: 700;
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

@media (max-width: 900px) {
  .detalle__inner {
    margin-top: -3rem;
  }

  .detalle__top {
    grid-template-columns: 1fr;
  }

  .meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .incluye ul {
    grid-template-columns: 1fr;
  }

  img {
    min-height: 320px;
  }
}

@media (max-width: 640px) {
  .detalle__hero {
    min-height: 120px;
  }

  .detalle__heading {
    flex-direction: column;
  }

  .meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  }

  .meta-card {
    padding: 1rem 0.5rem;
  }
}
</style>
