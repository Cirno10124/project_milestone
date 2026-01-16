<template>
  <div class="min-h-screen">
    <div class="max-w-4xl mx-auto px-4 py-10">
      <div class="mb-6">
        <h2 class="text-2xl font-semibold text-gray-900">选择组织</h2>
        <p class="text-sm text-gray-500 mt-1">组织用于隔离项目数据与成员权限。</p>
      </div>

      <PMAlert v-if="error" type="error" :message="error" class="mb-4" />

      <PMCard class="mb-6">
        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <PMFormField label="新建组织" required helpText="创建后将自动进入该组织。">
              <PMInput v-model="newOrgName" placeholder="例如：研发一组 / XX实验室" />
            </PMFormField>
          </div>
          <div class="shrink-0 pt-6">
            <PMButton variant="primary" type="button" :disabled="!newOrgName" @click="onCreateOrg">
              创建并进入
            </PMButton>
          </div>
        </div>
      </PMCard>

      <PMCard>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">我加入的组织</h3>
          <span class="text-sm text-gray-500">{{ orgs.length }} 个</span>
        </div>

        <div v-if="orgs.length" class="mt-4 divide-y divide-gray-200">
          <div
            v-for="o in orgs"
            :key="o.id"
            class="py-3 flex items-center justify-between gap-4"
          >
            <div class="min-w-0">
              <div class="font-medium text-gray-900 truncate">{{ o.name }}</div>
              <div class="text-xs text-gray-500">组织 ID：{{ o.id }}</div>
            </div>
            <PMButton variant="secondary" type="button" @click="selectOrg(o.id, o.name)">
              进入
            </PMButton>
          </div>
        </div>
        <p v-else class="mt-4 text-sm text-gray-500">暂无组织，请先创建。</p>
      </PMCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createOrg, getOrgs } from '@/api/org';
import { useAuthStore } from '@/store/auth';
import PMButton from '@/components/pm/PMButton.vue';
import PMAlert from '@/components/pm/PMAlert.vue';
import PMCard from '@/components/pm/PMCard.vue';
import PMFormField from '@/components/pm/PMFormField.vue';
import PMInput from '@/components/pm/PMInput.vue';

const orgs = ref<Array<{ id: number; name: string }>>([]);
const newOrgName = ref('');
const error = ref('');
const router = useRouter();
const auth = useAuthStore();

async function load() {
  error.value = '';
  try {
    const res = await getOrgs();
    orgs.value = res.data || [];
  } catch (e) {
    console.error('加载组织失败', e);
    error.value = '加载组织失败';
  }
}

function selectOrg(id: number, name: string) {
  auth.setCurrentOrg(id, name);
  router.push('/projects');
}

async function onCreateOrg() {
  error.value = '';
  try {
    const res = await createOrg({ name: newOrgName.value });
    const id = res.data?.id;
    const name = res.data?.name ?? newOrgName.value;
    if (typeof id === 'number') {
      auth.setCurrentOrg(id, name);
      router.push('/projects');
      return;
    }
    await load();
  } catch (e) {
    console.error('创建组织失败', e);
    error.value = '创建组织失败';
  }
}

onMounted(load);
</script>

<style scoped></style>