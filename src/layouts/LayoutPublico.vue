<script setup>
import FooterApp from '../components/FooterApp.vue'
import NavbarPublico from '../components/NavbarPublico.vue'
</script>

<template>
  <div class="layout layout-publico">
    <NavbarPublico />
    <main class="layout__content">
      <RouterView />
    </main>
    <FooterApp />
  </div>
</template>

<style scoped>
.layout-publico {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout__content {
  flex: 1;
  width: 100%;
  margin: 0;
  padding: 0;
}
</style>
