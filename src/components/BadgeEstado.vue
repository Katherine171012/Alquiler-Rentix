<script setup>
import StatusBadge from '../shared/components/ui/StatusBadge.vue'
</script>

<template>
  <StatusBadge v-bind="$attrs">
    <slot />
  </StatusBadge>
</template>
