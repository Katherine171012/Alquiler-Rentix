import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useVehiculoStore = defineStore('vehiculo', () => {
  const listado = ref([])
  const filtros = ref({})
  return { listado, filtros }
})
