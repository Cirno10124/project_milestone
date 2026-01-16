<template>
  <span :class="[base, colorStyles[color], $attrs.class]">
    <slot></slot>
    <button
      v-if="closable"
      type="button"
      class="hover:opacity-70 transition-opacity"
      @click="$emit('close')"
    >
      ×
    </button>
  </span>
</template>

<script setup lang="ts">
type Color = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';

interface Props {
  color?: Color;
  closable?: boolean;
}

withDefaults(defineProps<Props>(), {
  color: 'gray',
  closable: false,
});

defineEmits<{
  (e: 'close'): void;
}>();

const base =
  'inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-md border';

const colorStyles: Record<Color, string> = {
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
};
</script>

