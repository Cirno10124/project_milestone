<template>
  <div
    v-if="visible"
    :class="[
      'flex items-start gap-3 px-4 py-3 rounded-lg border',
      containerClass,
      $attrs.class,
    ]"
  >
    <span class="mt-0.5 flex-shrink-0" :class="iconClass">{{ icon }}</span>

    <p class="flex-1 text-sm font-medium">
      <slot>{{ message }}</slot>
    </p>

    <button
      v-if="closable"
      type="button"
      class="flex-shrink-0 hover:opacity-70 transition-opacity"
      @click="close"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface Props {
  type: AlertType;
  message?: string;
  closable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  closable: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const visible = ref(true);

watch(
  () => props.message,
  () => {
    // message 更新时重新显示（便于复用同一个组件实例）
    visible.value = true;
  },
);

const config = computed(() => {
  const map: Record<
    AlertType,
    { icon: string; containerClass: string; iconClass: string }
  > = {
    success: {
      icon: '✓',
      containerClass: 'bg-green-50 border-green-200 text-green-800',
      iconClass: 'text-green-600',
    },
    error: {
      icon: '!',
      containerClass: 'bg-red-50 border-red-200 text-red-800',
      iconClass: 'text-red-600',
    },
    warning: {
      icon: '!',
      containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconClass: 'text-yellow-600',
    },
    info: {
      icon: 'i',
      containerClass: 'bg-blue-50 border-blue-200 text-blue-800',
      iconClass: 'text-blue-600',
    },
  };
  return map[props.type];
});

const icon = computed(() => config.value.icon);
const containerClass = computed(() => config.value.containerClass);
const iconClass = computed(() => config.value.iconClass);

function close() {
  visible.value = false;
  emit('close');
}
</script>

