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
      v-bind="passThroughAttrs"
      :class="inputClasses"
      :value="modelValue"
      @input="onInput"
    />

    <p v-if="error" class="mt-1.5 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';

type As = 'input' | 'textarea';

interface Props {
  as?: As;
  error?: string;
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'input',
  error: '',
  modelValue: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
}>();

const attrs = useAttrs();
const slots = useSlots();

// 透传除 class/value/onInput 外的属性；class 在 inputClasses 里合并；value/onInput 由 v-model 接管
const passThroughAttrs = computed(() => {
  const { class: _class, value: _value, onInput: _onInput, ...rest } =
    attrs as Record<string, unknown>;
  return rest;
});

const modelValue = computed(() => props.modelValue);

function onInput(e: Event) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement | null;
  emit('update:modelValue', target?.value ?? '');
}

const baseStyles =
  'w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed';

const errorStyles = computed(() =>
  props.error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
);

const inputClasses = computed(() => [
  baseStyles,
  errorStyles.value,
  slots.icon ? 'pl-10' : '',
  (attrs as any)?.class,
]);
</script>

