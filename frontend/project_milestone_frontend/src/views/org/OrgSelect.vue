<template>
  <div>
    <h2>选择组织</h2>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="create">
      <input v-model="newOrgName" placeholder="新组织名称" />
      <button @click="onCreateOrg" :disabled="!newOrgName">创建并进入</button>
    </div>

    <h3>我加入的组织</h3>
    <ul v-if="orgs.length">
      <li v-for="o in orgs" :key="o.id">
        {{ o.name }}
        <button @click="selectOrg(o.id, o.name)">进入</button>
      </li>
    </ul>
    <p v-else>暂无组织，请先创建。</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createOrg, getOrgs } from '@/api/org';
import { useAuthStore } from '@/store/auth';

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

<style scoped>
.error {
  color: red;
}
.create {
  margin: 12px 0;
  display: flex;
  gap: 8px;
}
</style>


