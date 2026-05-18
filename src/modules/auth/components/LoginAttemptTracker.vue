<script setup>
import { computed } from 'vue'
import { getAttemptDisplay } from '../../../core/security/auth-security.service.js'
import { AUTH_SECURITY_POLICY } from '../../../core/security/auth-security.config.js'

const props = defineProps({
  failedAttempts: { type: Number, default: 0 },
  locked: { type: Boolean, default: false },
})

const policy = AUTH_SECURITY_POLICY
const display = computed(() => getAttemptDisplay(props.failedAttempts))
</script>

<template>
  <div class="attempt-tracker" :class="{ 'attempt-tracker--locked': locked }">
    <div class="attempt-tracker__head">
      <strong>{{ display.label }}</strong>
      <span v-if="failedAttempts > 0" class="attempt-tracker__badge">{{ display.remainingLabel }}</span>
    </div>

    <div class="attempt-tracker__bar" role="progressbar" :aria-valuenow="failedAttempts" :aria-valuemax="policy.maxFailedAttempts">
      <span
        v-for="step in display.steps"
        :key="step.step"
        class="attempt-tracker__step"
        :class="{
          'attempt-tracker__step--failed': step.failed,
          'attempt-tracker__step--captcha': step.captcha,
          'attempt-tracker__step--lock': step.lock,
        }"
        :title="`Intento ${step.step}`"
      >
        {{ step.step }}
      </span>
    </div>

    <p v-if="locked" class="attempt-tracker__locked">Cuenta bloqueada temporalmente</p>
  </div>
</template>

<style scoped>
.attempt-tracker {
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid #e8d5dc;
  background: #fff;
  display: grid;
  gap: 0.65rem;
}

.attempt-tracker--locked {
  border-color: #f5c26b;
  background: #fff8eb;
}

.attempt-tracker__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.attempt-tracker__head strong {
  color: #7b173b;
  font-size: 1rem;
}

.attempt-tracker__badge {
  font-size: 0.82rem;
  color: var(--color-text-soft);
}

.attempt-tracker__bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.4rem;
}

.attempt-tracker__step {
  height: 2.4rem;
  display: grid;
  place-items: center;
  border-radius: 0.55rem;
  font-weight: 700;
  font-size: 0.9rem;
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.attempt-tracker__step--failed {
  background: #fde8e8;
  border-color: #f5a8a8;
  color: #b42318;
}

.attempt-tracker__step--captcha:not(.attempt-tracker__step--failed) {
  box-shadow: inset 0 0 0 2px #7b173b;
}

.attempt-tracker__step--lock:not(.attempt-tracker__step--failed) {
  box-shadow: inset 0 0 0 2px #d97706;
}

.attempt-tracker__hint,
.attempt-tracker__locked {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-soft);
}

.attempt-tracker__locked {
  color: #8a4b00;
  font-weight: 600;
}
</style>
