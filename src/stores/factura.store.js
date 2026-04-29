import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFacturaStore = defineStore('factura', () => {
  const listado = ref([])
  return { listado }
})
