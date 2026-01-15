<template>
  <div :class="['space-y-1.5', $attrs.class]">
    <label class="block text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    <slot></slot>
    <p v-if="helpText" class="text-sm text-gray-500">{{ helpText }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string;
  required?: boolean;
  helpText?: string;
}

withDefaults(defineProps<Props>(), {
  required: false,
  helpText: '',
});
</script>

