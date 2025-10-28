import { mount } from '@vue/test-utils';
import PermissionWrapper from '../PermissionWrapper.vue';

describe('PermissionWrapper.vue', () => {
  it('renders slot content when allowed is true', () => {
    const wrapper = mount(PermissionWrapper, {
      props: { allowed: true },
      slots: { default: '<div class="slot-content">Allowed Content</div>' }
    });
    expect(wrapper.find('.slot-content').exists()).toBe(true);
  });

  it('does not render slot content when allowed is false', () => {
    const wrapper = mount(PermissionWrapper, {
      props: { allowed: false },
      slots: { default: '<div class="slot-content">Hidden Content</div>' }
    });
    expect(wrapper.find('.slot-content').exists()).toBe(false);
  });
});
