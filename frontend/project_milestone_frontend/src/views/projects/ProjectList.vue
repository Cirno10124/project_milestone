<template>
  <div class="min-h-screen">
    <div class="max-w-5xl mx-auto px-4 py-10">
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-semibold text-gray-900">我的项目</h2>
          <p class="text-sm text-gray-500 mt-1">
            当前用户：{{ authStore.user?.username || '未知' }} ·
            当前组织：{{ authStore.currentOrgName || `#${authStore.currentOrgId}` }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <PMButton variant="secondary" type="button" @click="backToOrgSelect">切换组织</PMButton>
          <PMButton variant="ghost" type="button" @click="logout">退出登录</PMButton>
        </div>
      </div>

      <PMAlert v-if="error" type="error" :message="error" class="mb-4" />

      <PMCard>
        <div class="flex items-center justify-between gap-4">
          <div class="text-sm text-gray-500">
            共 {{ projects.length }} 个项目
          </div>
          <PMButton variant="primary" type="button" @click="toCreate">新建项目</PMButton>
        </div>

        <div v-if="projects.length > 0" class="mt-4 divide-y divide-gray-200">
          <div
            v-for="p in projects"
            :key="p.id"
            class="py-3 flex items-center justify-between gap-4"
          >
            <div class="min-w-0">
              <router-link
                class="font-medium text-gray-900 hover:underline truncate block"
                :to="`/projects/${p.id}`"
              >
                {{ p.name }}
              </router-link>
              <div class="text-xs text-gray-500">项目 ID：{{ p.id }}</div>
            </div>
            <PMButton variant="secondary" type="button" @click="router.push(`/projects/${p.id}`)">
              打开
            </PMButton>
          </div>
        </div>

        <div v-else class="mt-6 text-sm text-gray-500">
          暂无项目。你可以先创建一个项目开始使用。
        </div>
      </PMCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getProjects } from '@/api/project';
import type { ProjectDto } from '@/api/project';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import PMButton from '@/components/pm/PMButton.vue';
import PMAlert from '@/components/pm/PMAlert.vue';
import PMCard from '@/components/pm/PMCard.vue';

const projects = ref<ProjectDto[]>([]);
const error = ref<string>('');
const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  try {
    const res = await getProjects();
    projects.value = res.data;
  } catch (e) {
    console.error('获取项目列表失败', e);
    error.value = '加载项目失败，请稍后重试';
  }
});

function toCreate() {
  router.push('/projects/create'); // 假设有创建页面
}

function backToOrgSelect() {
  router.push('/org/select');
}

function logout() {
  authStore.logout();
}
</script>

<style scoped></style>
