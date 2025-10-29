import { defineStore } from 'pinia';
import { getProjects, ProjectDto } from '@/api/project';
import { ref } from 'vue';

export const useProjectStore = defineStore('project', () => {
  const projects = ref<ProjectDto[]>([]);

  async function fetchProjects() {
    const res = await getProjects();
    projects.value = res.data;
  }

  return { projects, fetchProjects };
});
