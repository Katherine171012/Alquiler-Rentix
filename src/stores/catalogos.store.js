import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCatalogosStore = defineStore('catalogos', () => {
  const paises = ref([])
  const ciudades = ref([])
  const marcas = ref([])
  const categorias = ref([])

  return { paises, ciudades, marcas, categorias }
})
