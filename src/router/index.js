import { createRouter, createWebHistory } from 'vue-router'
import { ADMIN_ROLES, ROLES } from '../core/constants/roles'
import { applyAuthGuards } from '../core/router/guards'

const PANEL_ROLES = [ROLES.ADMIN, ROLES.VENDEDOR]
const ACCOUNT_ROLES = [ROLES.CLIENTE, ...ADMIN_ROLES]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/LayoutPublico.vue'),
      children: [
        {
          path: '',
          name: 'inicio',
          component: () => import('../modules/commerce/views/HomeCatalogView.vue'),
        },
        {
          path: 'vehiculos',
          name: 'catalogo-vehiculos',
          component: () => import('../modules/commerce/views/CatalogoVehiculosView.vue'),
        },
        {
          path: 'vehiculos/:id',
          name: 'detalle-vehiculo',
          component: () => import('../modules/commerce/views/VehicleDetailView.vue'),
        },
      ],
    },
    {
      path: '/',
      component: () => import('../layouts/LayoutPublico.vue'),
      children: [
        {
          path: 'login',
          name: 'login',
          meta: { requiresGuest: true },
          component: () => import('../modules/auth/views/LoginView.vue'),
        },
        {
          path: 'registro',
          name: 'registro',
          meta: { requiresGuest: true },
          component: () => import('../modules/auth/views/RegisterView.vue'),
        },
      ],
    },
    {
      path: '/reserva',
      component: () => import('../layouts/LayoutPublico.vue'),
      children: [
        {
          path: 'datos',
          name: 'reserva-datos',
          component: () => import('../modules/client/views/ReservationFlowView.vue'),
        },
        {
          path: 'extras',
          name: 'reserva-extras',
          component: () => import('../modules/client/views/ReservationFlowView.vue'),
        },
        {
          path: 'conductor',
          name: 'reserva-conductor',
          component: () => import('../modules/client/views/ReservationFlowView.vue'),
        },
        {
          path: 'pago',
          name: 'reserva-pago',
          meta: { requiresAuth: true, roles: [ROLES.CLIENTE] },
          component: () => import('../modules/client/views/CheckoutView.vue'),
        },
        {
          path: 'confirmacion',
          name: 'reserva-confirmacion',
          meta: { requiresAuth: true, roles: [ROLES.CLIENTE] },
          component: () => import('../modules/client/views/CheckoutView.vue'),
        },
      ],
    },
    {
      path: '/mi-cuenta',
      component: () => import('../layouts/LayoutCliente.vue'),
      meta: { requiresAuth: true, roles: ACCOUNT_ROLES },
      children: [
        {
          path: 'reservas',
          name: 'mis-reservas',
          component: () => import('../modules/client/views/MyReservationsView.vue'),
        },
        {
          path: 'facturas',
          name: 'mis-facturas',
          component: () => import('../modules/client/views/MyInvoicesView.vue'),
        },
        {
          path: 'perfil',
          name: 'perfil-cliente',
          component: () => import('../modules/client/views/ClientHomeView.vue'),
        },
      ],
    },
    {
      path: '/panel',
      component: () => import('../layouts/LayoutPanel.vue'),
      meta: { requiresAuth: true, roles: PANEL_ROLES },
      children: [
        {
          path: '',
          name: 'panel-dashboard',
          component: () => import('../modules/admin/views/AdminDashboardView.vue'),
        },
        {
          path: 'reservas',
          name: 'panel-reservas',
          component: () => import('../modules/admin/views/ReservasListView.vue'),
        },
        {
          path: 'clientes',
          name: 'panel-clientes',
          component: () => import('../modules/admin/views/ClientesListView.vue'),
        },
        {
          path: 'vehiculos',
          name: 'panel-vehiculos',
          component: () => import('../modules/admin/views/VehiculosListView.vue'),
        },
        {
          path: 'facturas',
          name: 'panel-facturas',
          component: () => import('../modules/admin/views/FacturasListView.vue'),
        },
        {
          path: 'conductores',
          name: 'panel-conductores',
          component: () => import('../modules/admin/views/ConductoresListView.vue'),
        },
        {
          path: 'extras',
          name: 'panel-extras',
          component: () => import('../modules/admin/views/ExtrasListView.vue'),
        },
        {
          path: 'configuracion',
          name: 'panel-configuracion',
          meta: { roles: [ROLES.ADMIN] },
          component: () => import('../modules/admin/views/ConfiguracionView.vue'),
        },
        {
          path: 'usuarios',
          name: 'panel-usuarios',
          meta: { roles: [ROLES.ADMIN] },
          component: () => import('../modules/admin/views/UsuariosListView.vue'),
        },
        {
          path: 'auditoria',
          name: 'panel-auditoria',
          meta: { roles: [ROLES.ADMIN] },
          component: () => import('../modules/admin/views/AuditoriaListView.vue'),
        },
      ],
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('../modules/system/views/ForbiddenView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../modules/system/views/NotFoundView.vue'),
    },
  ],
})

applyAuthGuards(router)

export default router
