import { mount, flushPromises } from '@vue/test-utils';
import ProjectList from '@/views/projects/ProjectList.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useProjectStore } from '@/store/project';
import { vi } from 'vitest';
import * as projectApi from '@/api/project';
import { createRouter, createWebHistory } from 'vue-router';
vi.mock('@/api/project');
const getProjectsMock = projectApi.getProjects as vi.Mock;
getProjectsMock.mockResolvedValue({ data: [
  { id: 1, name: 'Proj1' },
  { id: 2, name: 'Proj2' }
] });

// 简单路由，映射 to
const routes = [
  { path: '/projects/:id', name: 'ProjectDetail' },
  { path: '/projects', name: 'ProjectList' }
];
const router = createRouter({ history: createWebHistory(), routes });

describe('ProjectList.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    router.push({ name: 'ProjectList' });
  });

  it('renders project items after fetch', async () => {
    const wrapper = mount(ProjectList, { global: { plugins: [createPinia(), router] } });
    await flushPromises();
    const items = wrapper.findAll('li');
    expect(items).toHaveLength(2);
    expect(items[0].text()).toContain('Proj1');
    expect(items[1].text()).toContain('Proj2');
  });
});
