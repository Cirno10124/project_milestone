<template>
  <div>
    <h2>我的项目</h2>
    <button @click="toCreate">新建项目</button>
    <ul>
      <li v-for="p in projects" :key="p.id">
        <router-link :to="`/projects/${p.id}`">{{ p.name }}</router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getProjects, ProjectDto } from '@/api/project';
import { useRouter } from 'vue-router';

const projects = ref<ProjectDto[]>([]);
const router = useRouter();

onMounted(async () => {
  const res = await getProjects();
  projects.value = res.data;
});

function toCreate() {
  router.push('/projects/create'); // 假设有创建页面
}
</script>
