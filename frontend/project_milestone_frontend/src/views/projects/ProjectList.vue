<template>
  <div>
    <div class="user-info" style="float:right; margin-right: 20px;">
      当前用户：{{ authStore.user?.username || '未知' }}
    </div>
    <button @click="logout" style="float:right;">退出登录</button>
    <p v-if="error" class="error">{{ error }}</p>
    <h2>我的项目</h2>
    <button @click="toCreate">新建项目</button>
    <ul v-if="projects.length > 0">
      <li v-for="p in projects" :key="p.id">
        <router-link :to="`/projects/${p.id}`">{{ p.name }}</router-link>
      </li>
    </ul>
    <p v-else class="no-project">暂无项目</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getProjects } from '@/api/project';
import type { ProjectDto } from '@/api/project';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

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

function logout() {
  authStore.logout();
}
</script>

<style scoped>
.error {
  color: red;
  margin-bottom: 10px;
}
</style>
