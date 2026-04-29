<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CategoryListCard,
  KpiCard,
  MonthlyRevenueChart,
  QuickActionsCard,
  RecentReservations,
  ReservationStatusCard,
} from '../components'
import { fetchDashboardData, formatCurrency } from '../services'

const router = useRouter()

const isLoading = ref(true)
const errorMessage = ref('')
const dashboard = ref({
  kpis: {
    vehiculosDisponibles: 0,
    reservasActivas: 0,
    clientesActivos: 0,
    ingresosTotales: 0,
  },
  monthlyRevenue: [],
  vehiclesByCategory: [],
  reservationStatuses: [],
  recentReservations: [],
})

const kpis = computed(() => [
  {
    title: 'Vehiculos Disponibles',
    value: dashboard.value.kpis.vehiculosDisponibles,
    helper: 'Disponibilidad actual',
    icon: 'M5 11l1.5-4.5h11L19 11v6h-2v-2H7v2H5v-6zm2-.5h10l-.8-2.5H7.8L7 10.5zM7.5 14A1.5 1.5 0 109 12.5 1.5 1.5 0 007.5 14zm9 0a1.5 1.5 0 101.5-1.5 1.5 1.5 0 00-1.5 1.5z',
  },
  {
    title: 'Reservas Activas',
    value: dashboard.value.kpis.reservasActivas,
    helper: 'Pendientes y confirmadas',
    icon: 'M7 2v2H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zm12 7H5v10h14V9z',
  },
  {
    title: 'Clientes Activos',
    value: dashboard.value.kpis.clientesActivos,
    helper: 'Clientes habilitados',
    icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13z',
  },
  {
    title: 'Ingresos Totales',
    value: formatCurrency(dashboard.value.kpis.ingresosTotales),
    helper: 'Acumulado en facturas',
    icon: 'M12 2a1 1 0 011 1v1.1c1.7.3 3 1.5 3 3.2h-2c0-.8-.9-1.4-2-1.4s-2 .6-2 1.3c0 .8.9 1.2 2.5 1.6 2.3.6 3.5 1.5 3.5 3.4 0 1.7-1.3 3-3 3.3V21h-2v-2.1c-1.9-.4-3.3-1.8-3.3-3.7h2c0 1 .9 1.8 2.3 1.8 1.3 0 2.1-.6 2.1-1.5s-.7-1.3-2.4-1.8C8.4 13 7 12.2 7 10.2c0-1.7 1.2-3 3-3.3V3a1 1 0 011-1h1z',
  },
])

const quickActions = [
  { label: 'Nueva Reserva', to: '/panel/reservas', primary: true },
  { label: 'Registrar Cliente', to: '/panel/clientes' },
  { label: 'Agregar Vehiculo', to: '/panel/vehiculos' },
  { label: 'Generar Factura', to: '/panel/facturas' },
]

async function loadDashboard() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    dashboard.value = await fetchDashboardData()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo cargar el dashboard'
  } finally {
    isLoading.value = false
  }
}

function runQuickAction(action) {
  if (!action?.to) return
  router.push(action.to)
}

onMounted(loadDashboard)
</script>

<template>
  <section class="admin-dashboard">
    <header class="admin-dashboard__header">
      <h1>Dashboard</h1>
      <p>Resumen general del sistema</p>
    </header>

    <p v-if="isLoading" class="admin-dashboard__state">Cargando datos del dashboard...</p>
    <p v-else-if="errorMessage" class="admin-dashboard__state admin-dashboard__state--error">
      {{ errorMessage }}
    </p>

    <template v-else>
      <div class="admin-dashboard__kpis">
        <KpiCard
          v-for="item in kpis"
          :key="item.title"
          :title="item.title"
          :value="item.value"
          :helper="item.helper"
          :icon="item.icon"
        />
      </div>

      <div class="admin-dashboard__grid">
        <MonthlyRevenueChart :items="dashboard.monthlyRevenue" />
        <RecentReservations :items="dashboard.recentReservations" />
      </div>

      <div class="admin-dashboard__grid admin-dashboard__grid--bottom">
        <CategoryListCard :items="dashboard.vehiclesByCategory" />
        <ReservationStatusCard :items="dashboard.reservationStatuses" />
        <QuickActionsCard :actions="quickActions" @run="runQuickAction" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.admin-dashboard {
  display: grid;
  gap: 1rem;
}

.admin-dashboard__header h1 {
  margin: 0;
  font-size: 2rem;
}

.admin-dashboard__header p {
  margin: 0.25rem 0 0;
  color: #667085;
}

.admin-dashboard__state {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 0.6rem;
  border: 1px solid var(--color-border);
  background: #fff;
}

.admin-dashboard__state--error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.admin-dashboard__kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.admin-dashboard__grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr;
  gap: 1rem;
}

.admin-dashboard__grid--bottom {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1200px) {
  .admin-dashboard__kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-dashboard__grid,
  .admin-dashboard__grid--bottom {
    grid-template-columns: 1fr;
  }
}
</style>
