<script setup>
import BaseTable from '../shared/components/base/BaseTable.vue'
</script>

<template>
  <BaseTable v-bind="$attrs">
    <slot />
  </BaseTable>
</template>
