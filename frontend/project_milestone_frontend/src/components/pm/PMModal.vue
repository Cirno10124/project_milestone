<template>
  <teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        @click="emitClose"
      />

      <!-- Dialog -->
      <div
        class="relative bg-white rounded-xl shadow-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        :class="widthClass"
        @click.stop
      >
        <div v-if="title" class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            @click="emitClose"
          >
            ×
          </button>
        </div>

        <div class="px-6 py-4 overflow-y-auto flex-1">
          <slot></slot>
        </div>

        <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

type Size = 'md' | 'lg' | 'xl';

interface Props {
  open: boolean;
  title?: string;
  size?: Size;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  size: 'lg',
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:open', v: boolean): void;
}>();

const widthClass = computed(() => {
  if (props.size === 'md') return 'max-w-lg';
  if (props.size === 'xl') return 'max-w-5xl';
  return 'max-w-3xl';
});

function emitClose() {
  emit('update:open', false);
  emit('close');
}

// 禁用背景滚动
watch(
  () => props.open,
  (v) => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = v ? 'hidden' : '';
  },
  { immediate: true },
);
</script>

