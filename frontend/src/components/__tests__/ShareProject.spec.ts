import { mount } from '@vue/test-utils';
import ShareProject from '../ShareProject.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useGroupStore } from '../../store/group';
import * as projectApi from '../../api/project';

// mock shareProject API
jest.mock('../../api/project');
const shareProjectMock = projectApi.shareProject as jest.Mock;
shareProjectMock.mockResolvedValue({ data: { success: true } });

// mock alert
window.alert = jest.fn();

describe('ShareProject.vue', () => {
  let groupStore: ReturnType<typeof useGroupStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    groupStore = useGroupStore();
    // populate groups
    groupStore.groups = [
      { id: 10, name: 'Group A' },
      { id: 20, name: 'Group B' },
    ];
    // stub fetchGroups
    groupStore.fetchGroups = jest.fn().mockResolvedValue(undefined);
  });

  it('renders dropdown with groups and defaults', async () => {
    const wrapper = mount(ShareProject, {
      global: {
        plugins: [createPinia()],
        mocks: { $route: { params: { id: 5 } } },
      },
    });
    // onMounted
    await wrapper.vm.$nextTick();
    const options = wrapper.findAll('option');
    expect(options.map(o => o.text())).toEqual(['Group A', 'Group B']);
    // default selected is first
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('10');
  });

  it('calls shareProject with correct payload on button click', async () => {
    const wrapper = mount(ShareProject, {
      global: {
        plugins: [createPinia()],
        mocks: { $route: { params: { id: 5 } } },
      },
    });
    await wrapper.vm.$nextTick();
    // change selection and role
    await wrapper.find('select').setValue('20');
    await wrapper.findAll('input[type="radio"]')[1].setValue(); // select member or admin
    await wrapper.find('button').trigger('click');
    expect(shareProjectMock).toHaveBeenCalledWith({ projectId: 5, groupId: 20, role: 'member' });
    expect(window.alert).toHaveBeenCalledWith('分享成功');
  });
});
