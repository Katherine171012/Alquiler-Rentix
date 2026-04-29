<script setup>
import { CarFront } from 'lucide-vue-next'
</script>

<template>
  <footer class="footer-app">
    <div class="footer-app__inner">
      <section>
        <strong><CarFront :size="12" /> RentixAutos</strong>
        <span>Tu mejor opcion para rentar vehiculos de calidad.</span>
      </section>
      <section>
        <strong>Navegacion</strong>
        <RouterLink to="/">Inicio</RouterLink>
        <RouterLink to="/vehiculos">Vehiculos</RouterLink>
        <RouterLink to="/login">Iniciar sesion</RouterLink>
      </section>
      <section>
        <strong>Ayuda</strong>
        <a href="#">Preguntas frecuentes</a>
        <a href="#">Terminos y condiciones</a>
        <a href="#">Politica de privacidad</a>
      </section>
      <section>
        <strong>Contacto</strong>
        <span>Email: contacto@rentixautos.com</span>
        <span>Tel: +1 (555) 123-4567</span>
        <span>Horario: L-V 9AM-6PM</span>
      </section>
    </div>
    <p class="footer-copy">© 2026 RentixAutos. Todos los derechos reservados.</p>
  </footer>
</template>

<style scoped>
.footer-app {
  background: var(--color-footer);
  color: #fff;
  padding: 3rem 1rem 1.2rem;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-app__inner {
  max-width: 1160px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 2rem;
}

section {
  display: grid;
  gap: 0.45rem;
}

section strong {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

section strong :deep(svg) {
  color: #fff;
}

section span,
section a {
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.72);
}

a {
  text-decoration: none;
}

a:hover {
  color: #fff;
}

.footer-copy {
  max-width: 1160px;
  margin: 2rem auto 0;
  padding-top: 1.2rem;
  text-align: center;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.56);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

@media (max-width: 900px) {
  .footer-app__inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.4rem;
  }
}
@media (max-width: 640px) {
  .footer-app__inner {
    grid-template-columns: 1fr;
  }
}
</style>
