<template>
  <div class="min-h-screen">
    <div class="max-w-3xl mx-auto px-4 py-10">
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold text-gray-900">新建项目</h2>
          <p class="text-sm text-gray-500 mt-1">在当前组织下创建项目。</p>
        </div>
        <PMButton variant="ghost" type="button" @click="cancel">返回</PMButton>
      </div>

      <PMCard>
        <form class="space-y-5" @submit.prevent="onSubmit">
          <PMFormField label="项目名称" required>
            <PMInput id="name" v-model="form.name" placeholder="例如：2026 春季版本" required />
          </PMFormField>

          <PMFormField label="描述" helpText="可选，用于说明项目背景与目标。">
            <PMInput
              as="textarea"
              id="description"
              v-model="form.description"
              rows="5"
              placeholder="写点什么…"
            />
          </PMFormField>

          <PMAlert v-if="error" type="error" :message="error" />

          <div class="flex items-center justify-end gap-2">
            <PMButton variant="secondary" type="button" @click="cancel">取消</PMButton>
            <PMButton variant="primary" type="submit">创建</PMButton>
          </div>
        </form>
      </PMCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { createProject } from '@/api/project';
import PMButton from '@/components/pm/PMButton.vue';
import PMAlert from '@/components/pm/PMAlert.vue';
import PMCard from '@/components/pm/PMCard.vue';
import PMFormField from '@/components/pm/PMFormField.vue';
import PMInput from '@/components/pm/PMInput.vue';

const router = useRouter();
const authStore = useAuthStore();
const form = reactive({ name: '', description: '' });
const error = ref('');

async function onSubmit() {
  error.value = '';
  try {
    const res = await createProject(form);
    router.push(`/projects/${res.data.id}`);
  } catch (e) {
    console.error('创建失败', e);
    error.value = '创建失败，请重试';
  }
}

function cancel() {
  router.back();
}
</script>

<style scoped></style>
