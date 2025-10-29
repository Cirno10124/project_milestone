import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ProjectDetail from '@/views/projects/ProjectDetail.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { vi } from 'vitest';
import * as projectApi from '@/api/project';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/api/project');
const getProjectMock = projectApi.getProject as vi.Mock;
getProjectMock.mockResolvedValue({ data: { id: 1, name: 'P', description: 'D', role: 'admin' } });

describe('ProjectDetail.vue', () => {
  const routes = [
    { path: '/projects/:id', name: 'ProjectDetail' },
  ];
  const router = createRouter({ history: createWebHistory(), routes });

  beforeEach(() => {
    setActivePinia(createPinia());
    router.push({ name: 'ProjectDetail', params: { id: '1' } });
  });

  it('shows add WBS button for admin', async () => {
    const wrapper = mount(ProjectDetail, { global: { plugins: [createPinia(), router] } });
    await flushPromises();
    expect(wrapper.find('button').text()).toBe('添加 WBS 节点');
  });

  it('hides add WBS button for member', async () => {
    getProjectMock.mockResolvedValueOnce({ data: { id: 1, name: 'P', description: 'D', role: 'member' } });
    const wrapper = mount(ProjectDetail, { global: { plugins: [createPinia(), router] } });
    await flushPromises();
    expect(wrapper.find('button').exists()).toBe(false);
  });
});
