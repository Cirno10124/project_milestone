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
import { onMounted } from 'vue';
import { useProjectStore } from '../../store/project';
import { useRouter } from 'vue-router';

const projectStore = useProjectStore();
const projects = projectStore.projects;
const router = useRouter();

onMounted(async () => {
  await projectStore.fetchProjects();
});

function toCreate() {
  router.push('/projects/create'); // 假设有创建页面
}
</script>
