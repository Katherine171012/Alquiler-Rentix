<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, CalendarDays, Fuel, Settings2, UserRound } from 'lucide-vue-next'
import { obtenerVehiculo } from '../../../api/vehiculos.api'
import { construirUrlImagenVehiculo } from '../../../utils/imagenesVehiculo'

const route = useRoute()
const cargando = ref(false)
const error = ref('')
const vehiculo = ref(null)
const fechaInicio = ref('')
const fechaFin = ref('')

const titulo = computed(() => {
  if (!vehiculo.value) return 'Detalle del vehículo'
  return `${vehiculo.value.nombreMarca} ${vehiculo.value.modeloVehiculo}`
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

onMounted(cargarDetalle)
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

            <label>
              Fecha de recogida
              <input v-model="fechaInicio" type="date" />
            </label>
            <label>
              Fecha de entrega
              <input v-model="fechaFin" type="date" />
            </label>
            <RouterLink
              :to="`/reserva/datos?idVehiculo=${vehiculo.idVehiculo}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`"
              class="reserva-btn"
            >
              Reservar ahora
            </RouterLink>
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
            <div>
              <UserRound :size="18" />
              <div>
                <strong>Capacidad</strong>
                <span>{{ vehiculo.capacidadPasajeros }} personas</span>
              </div>
            </div>
            <div>
              <Settings2 :size="18" />
              <div>
                <strong>Transmision</strong>
                <span>{{ vehiculo.tipoTransmision }}</span>
              </div>
            </div>
            <div>
              <Fuel :size="18" />
              <div>
                <strong>Combustible</strong>
                <span>{{ vehiculo.tipoCombustible }}</span>
              </div>
            </div>
            <div>
              <CalendarDays :size="18" />
              <div>
                <strong>Año</strong>
                <span>{{ vehiculo.añoFabricacion }}</span>
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
  margin-top: 1.4rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.meta-grid div {
  border: 1px solid var(--color-border);
  border-radius: 1.1rem;
  padding: 1rem;
  background: var(--color-surface-muted);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.meta-grid div svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

.meta-grid strong,
.meta-grid span {
  display: block;
}

.meta-grid strong {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  margin-bottom: 0.2rem;
}

.meta-grid span {
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

  .detalle__top,
  .meta-grid,
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
}
</style>
