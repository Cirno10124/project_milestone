<template>
  <div v-if="allowed">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  allowed: boolean;
}>();

const allowed = props.allowed;
</script>
