<template>
  <div :class="classes">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  hoverable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: false,
});

const classes = computed(() => [
  'bg-white rounded-xl border border-gray-200 p-6 transition-all duration-200',
  props.hoverable ? 'hover:shadow-lg hover:-translate-y-0.5' : '',
]);
</script>

