import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ProjectDetail from '@/views/projects/ProjectDetail.vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import * as projectApi from '@/api/project';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/api/project', () => ({
  getProject: vi.fn(),
  getProjectRepo: vi.fn(),
  updateProjectRepo: vi.fn(),
  updateProjectStartDate: vi.fn(),
  exportGantt: vi.fn(),
  getGanttData: vi.fn(),
  getProjectMembers: vi.fn(),
}));
vi.mock('@/api/wbs-item', () => ({
  getWbsItems: vi.fn(),
  createWbsItem: vi.fn(),
  updateWbsItem: vi.fn(),
}));
vi.mock('@/api/task', () => ({
  getTasksByProject: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  setTaskAssignees: vi.fn(),
}));
vi.mock('@/api/dependency', () => ({
  createDependency: vi.fn(),
}));
vi.mock('@/api/schedule', () => ({
  computeSchedule: vi.fn(),
}));

const getProjectMock = projectApi.getProject as unknown as vi.Mock;
const getProjectRepoMock = (projectApi as any).getProjectRepo as vi.Mock;

describe('ProjectDetail.vue', () => {
  const routes = [{ path: '/projects/:id', name: 'ProjectDetail', component: { template: '<div />' } }];
  const router = createRouter({ history: createMemoryHistory(), routes });

  beforeEach(async () => {
    setActivePinia(createPinia());
    getProjectMock.mockResolvedValue({ data: { id: 1, name: 'P', description: 'D', role: 'admin' } });
    getProjectRepoMock.mockResolvedValue({
      data: {
        repoUrl: '',
        repoProvider: 'gitlab',
        repoDefaultBranch: 'main',
        gitSyncEnabled: false,
        webhookPath: '/git/webhook/projects/1',
        webhookToken: 'token',
        lastGitEventAt: null,
      },
    });
    router.push({ name: 'ProjectDetail', params: { id: '1' } });
    await router.isReady();
  });

  it('shows add WBS button for admin', async () => {
    const wrapper = mount(ProjectDetail, { global: { plugins: [createPinia(), router] } });
    await flushPromises();
    const buttons = wrapper.findAll('button');
    const hasAddWbs = buttons.some((b) => b.text().includes('添加 WBS 节点'));
    expect(hasAddWbs).toBe(true);
  });

  it('hides add WBS button for member', async () => {
    getProjectMock.mockResolvedValueOnce({ data: { id: 1, name: 'P', description: 'D', role: 'member' } });
    const wrapper = mount(ProjectDetail, { global: { plugins: [createPinia(), router] } });
    await flushPromises();
    const buttons = wrapper.findAll('button');
    const hasAddWbs = buttons.some((b) => b.text().includes('添加 WBS 节点'));
    expect(hasAddWbs).toBe(false);
  });
});
