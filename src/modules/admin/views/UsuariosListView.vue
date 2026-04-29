<script setup>
import { computed, onMounted, ref } from 'vue'
import { Eye, Pencil, Plus } from 'lucide-vue-next'
import { useAuthStore } from '../../../stores/auth.store'
import { listarRoles } from '../../../api/roles.api'
import { crearUsuario, inactivarUsuario, listarUsuarios, obtenerUsuario, actualizarUsuario, activarUsuario } from '../../../api/usuarios.api'
import { asignarRolUsuario, listarRolesUsuario, quitarRolUsuario } from '../../../api/usuariosRoles.api'
import { AdminEmptyState, AdminModal, AdminPageHeader, AdminSearchBar, AdminStatusBadge } from '../components'
import { activeStateMeta, formatDate, getItems } from '../utils/panel'

const authStore = useAuthStore()
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchTerm = ref('')
const usuarios = ref([])
const roles = ref([])
const selectedUsuario = ref(null)
const activeModal = ref('')
const form = ref(createUsuarioForm())

function createUsuarioForm() {
  return {
    idUsuario: '',
    username: '',
    correo: '',
    password: '',
    activo: true,
    estadoUsuario: 'ACT',
    idRol: '',
    assignedRoleIds: [],
  }
}

const roleMap = computed(() => Object.fromEntries(roles.value.map((rol) => [rol.idRol, rol.nombreRol])))

const filteredUsuarios = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return usuarios.value

  return usuarios.value.filter((usuario) => {
    const haystack = [
      usuario.username,
      usuario.correo,
      ...usuario.assignedRoleIds.map((idRol) => roleMap.value[idRol]),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  })
})

async function enrichUsuarios(list) {
  const rolesPorUsuario = await Promise.all(
    list.map(async (usuario) => {
      try {
        const response = await listarRolesUsuario(usuario.idUsuario)
        return getItems(response.data)
      } catch {
        return []
      }
    }),
  )

  return list.map((usuario, index) => ({
    ...usuario,
    assignedRoles: rolesPorUsuario[index],
    assignedRoleIds: rolesPorUsuario[index].map((rol) => rol.idRol),
  }))
}

function resetMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

async function loadUsuarios() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [usuariosResponse, rolesResponse] = await Promise.all([listarUsuarios(), listarRoles()])
    roles.value = getItems(rolesResponse.data)
    usuarios.value = await enrichUsuarios(getItems(usuariosResponse.data))
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudieron cargar los usuarios.'
  } finally {
    isLoading.value = false
  }
}

async function openDetail(idUsuario) {
  try {
    const response = await obtenerUsuario(idUsuario)
    const usuario = response.data
    const rolesResponse = await listarRolesUsuario(idUsuario)
    selectedUsuario.value = {
      ...usuario,
      assignedRoles: getItems(rolesResponse.data),
    }
    activeModal.value = 'detail'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo obtener el usuario.'
  }
}

async function openEdit(idUsuario) {
  try {
    const response = await obtenerUsuario(idUsuario)
    const usuario = response.data
    const rolesResponse = await listarRolesUsuario(idUsuario)
    const assignedRoles = getItems(rolesResponse.data)
    selectedUsuario.value = {
      ...usuario,
      assignedRoles,
    }
    form.value = {
      idUsuario: usuario.idUsuario,
      username: usuario.username,
      correo: usuario.correo,
      password: '',
      activo: Boolean(usuario.activo),
      estadoUsuario: usuario.estadoUsuario ?? 'ACT',
      idRol: assignedRoles[0]?.idRol ?? '',
      assignedRoleIds: assignedRoles.map((item) => item.idRol),
    }
    activeModal.value = 'form'
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo cargar el usuario.'
  }
}

function closeModal() {
  activeModal.value = ''
  selectedUsuario.value = null
  form.value = createUsuarioForm()
}

async function syncUserRole(idUsuario, targetRoleId, currentRoles = []) {
  const currentRoleIds = currentRoles.map((item) => item.idRol)
  const currentLinkByRoleId = Object.fromEntries(currentRoles.map((item) => [item.idRol, item.idUsuarioRol]))

  const removals = currentRoleIds
    .filter((idRol) => idRol !== targetRoleId)
    .map((idRol) => quitarRolUsuario(currentLinkByRoleId[idRol]))

  await Promise.all(removals)

  if (targetRoleId && !currentRoleIds.includes(targetRoleId)) {
    await asignarRolUsuario({
      idUsuario,
      idRol: Number(targetRoleId),
      creadoPorUsuario: authStore.user?.username ?? 'admin',
    })
  }
}

async function submitUsuario() {
  isSubmitting.value = true
  resetMessages()

  try {
    if (form.value.idUsuario) {
      await actualizarUsuario(form.value.idUsuario, {
        idUsuario: Number(form.value.idUsuario),
        correo: form.value.correo,
        estadoUsuario: form.value.activo ? 'ACT' : 'INA',
        activo: Boolean(form.value.activo),
        modificadoPorUsuario: authStore.user?.username ?? 'admin',
      })

      await syncUserRole(form.value.idUsuario, Number(form.value.idRol), selectedUsuario.value?.assignedRoles ?? [])
      successMessage.value = 'Usuario actualizado correctamente.'
    } else {
      const response = await crearUsuario({
        username: form.value.username,
        correo: form.value.correo,
        password: form.value.password,
        creadoPorUsuario: authStore.user?.username ?? 'admin',
      })

      const newId = response.data?.idUsuario
      if (newId && form.value.idRol) {
        await asignarRolUsuario({
          idUsuario: newId,
          idRol: Number(form.value.idRol),
          creadoPorUsuario: authStore.user?.username ?? 'admin',
        })
      }

      successMessage.value = 'Usuario creado correctamente.'
    }

    closeModal()
    await loadUsuarios()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo guardar el usuario.'
  } finally {
    isSubmitting.value = false
  }
}

async function toggleUserStatus(usuario) {
  resetMessages()
  try {
    if (usuario.activo) {
      await inactivarUsuario(usuario.idUsuario)
      successMessage.value = 'Usuario inactivado correctamente.'
    } else {
      await activarUsuario(usuario.idUsuario)
      successMessage.value = 'Usuario activado correctamente.'
    }
    await loadUsuarios()
  } catch (error) {
    errorMessage.value = error?.message ?? 'No se pudo cambiar el estado del usuario.'
  }
}

onMounted(loadUsuarios)
</script>

<template>
  <section class="admin-page">
    <AdminPageHeader title="Usuarios" description="Gestion de usuarios del sistema">
      <button type="button" class="admin-button" @click="activeModal = 'form'">
        <Plus :size="18" />
        <span>Nuevo Usuario</span>
      </button>
    </AdminPageHeader>

    <p v-if="errorMessage" class="admin-state-message admin-state-message--error">{{ errorMessage }}</p>
    <p v-else-if="successMessage" class="admin-state-message admin-state-message--success">{{ successMessage }}</p>

    <div class="admin-card">
      <div class="admin-card__section">
        <AdminSearchBar v-model="searchTerm" placeholder="Buscar usuario por username, correo o rol..." />
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody v-if="!isLoading && filteredUsuarios.length">
            <tr v-for="usuario in filteredUsuarios" :key="usuario.idUsuario">
              <td><strong>{{ usuario.username }}</strong></td>
              <td>{{ usuario.correo }}</td>
              <td>
                <div class="admin-actions">
                  <AdminStatusBadge
                    v-for="roleId in usuario.assignedRoleIds"
                    :key="roleId"
                    :label="roleMap[roleId] || `Rol ${roleId}`"
                    tone="neutral"
                  />
                </div>
              </td>
              <td>{{ formatDate(usuario.fechaRegistroUtc) }}</td>
              <td><AdminStatusBadge v-bind="activeStateMeta(usuario.estadoUsuario || (usuario.activo ? 'ACT' : 'INA'))" /></td>
              <td>
                <div class="admin-actions">
                  <button type="button" class="admin-icon-button" @click="openDetail(usuario.idUsuario)"><Eye :size="17" /></button>
                  <button type="button" class="admin-icon-button" @click="openEdit(usuario.idUsuario)"><Pencil :size="17" /></button>
                  <button type="button" class="admin-button--ghost" @click="toggleUserStatus(usuario)">
                    {{ usuario.activo ? 'Inactivar' : 'Activar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="isLoading" class="admin-card__section"><p class="admin-state-message">Cargando usuarios...</p></div>
        <div v-else-if="!filteredUsuarios.length" class="admin-card__section">
          <AdminEmptyState title="No hay usuarios para mostrar" description="Crea usuarios nuevos y asignales su rol operativo." />
        </div>
      </div>
    </div>

    <AdminModal v-if="activeModal === 'form'" :title="form.idUsuario ? 'Editar Usuario' : 'Nuevo Usuario'" @close="closeModal">
      <form class="admin-form" @submit.prevent="submitUsuario">
        <div class="admin-grid admin-grid--2">
          <div class="admin-field"><label>Username *</label><input v-model="form.username" :disabled="Boolean(form.idUsuario)" required /></div>
          <div class="admin-field"><label>Correo *</label><input v-model="form.correo" type="email" required /></div>
        </div>

        <div v-if="!form.idUsuario" class="admin-field">
          <label>Password *</label>
          <input v-model="form.password" type="password" required />
        </div>

        <div class="admin-grid admin-grid--2">
          <div class="admin-field">
            <label>Rol principal *</label>
            <select v-model="form.idRol" required>
              <option value="">Seleccionar rol...</option>
              <option v-for="rol in roles" :key="rol.idRol" :value="rol.idRol">{{ rol.nombreRol }}</option>
            </select>
          </div>
          <div v-if="form.idUsuario" class="admin-field">
            <label>Estado *</label>
            <select v-model="form.activo">
              <option :value="true">Activo</option>
              <option :value="false">Inactivo</option>
            </select>
          </div>
        </div>
      </form>

      <template #footer>
        <button type="button" class="admin-button--secondary" @click="closeModal">Cancelar</button>
        <button type="button" class="admin-button" :disabled="isSubmitting" @click="submitUsuario">
          {{ isSubmitting ? 'Guardando...' : 'Guardar Usuario' }}
        </button>
      </template>
    </AdminModal>

    <AdminModal v-if="activeModal === 'detail' && selectedUsuario" title="Detalle del Usuario" @close="closeModal">
      <div class="admin-detail-grid">
        <article class="admin-detail-card">
          <dl>
            <div><dt>Username</dt><dd>{{ selectedUsuario.username }}</dd></div>
            <div><dt>Correo</dt><dd>{{ selectedUsuario.correo }}</dd></div>
            <div><dt>Fecha de registro</dt><dd>{{ formatDate(selectedUsuario.fechaRegistroUtc) }}</dd></div>
          </dl>
        </article>
        <article class="admin-detail-card">
          <dl>
            <div><dt>Estado</dt><dd><AdminStatusBadge v-bind="activeStateMeta(selectedUsuario.estadoUsuario || (selectedUsuario.activo ? 'ACT' : 'INA'))" /></dd></div>
            <div><dt>Roles asignados</dt><dd>{{ selectedUsuario.assignedRoles?.map((item) => item.nombreRol).join(', ') || '-' }}</dd></div>
          </dl>
        </article>
      </div>
    </AdminModal>
  </section>
</template>
