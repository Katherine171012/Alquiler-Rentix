import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useInterfazStore = defineStore('interfaz', () => {
  const sidebarAbierto = ref(false)
  const cargandoGlobal = ref(false)
  return { sidebarAbierto, cargandoGlobal }
})
