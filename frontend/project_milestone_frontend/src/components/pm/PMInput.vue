<template>
  <div :class="$slots.icon ? 'relative' : ''">
    <div
      v-if="$slots.icon"
      class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
    >
      <slot name="icon"></slot>
    </div>

    <component
      :is="as === 'textarea' ? 'textarea' : 'input'"
      v-bind="restAttrs"
      :class="inputClasses"
    />

    <p v-if="error" class="mt-1.5 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';

type As = 'input' | 'textarea';

interface Props {
  as?: As;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'input',
  error: '',
});

const attrs = useAttrs();

// class 由本组件统一生成；外部 class 允许叠加
const restAttrs = computed(() => attrs as Record<string, unknown>);

const baseStyles =
  'w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed';

const errorStyles = computed(() =>
  props.error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
);

const inputClasses = computed(() => [
  baseStyles,
  errorStyles.value,
  $slots.icon ? 'pl-10' : '',
  (attrs as any)?.class,
]);
</script>

