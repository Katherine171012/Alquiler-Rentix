import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useClienteStore = defineStore('cliente', () => {
  const perfil = ref(null)
  return { perfil }
})
