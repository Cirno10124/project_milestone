import { defineStore } from 'pinia';
import { login as loginApi, register as registerApi, getProfile } from '../api/auth';
import { ref } from 'vue';
import router from '../router';

// 用户信息类型定义
interface User {
  id: number;
  username: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '');
  const user = ref<User | null>(null);
  const currentOrgId = ref<number>(Number(localStorage.getItem('currentOrgId') || 0) || 0);
  const currentOrgName = ref(localStorage.getItem('currentOrgName') || '');

  function setToken(t: string) {
    token.value = t;
    localStorage.setItem('token', t);
  }

  function clearAuth() {
    token.value = '';
    user.value = null;
    currentOrgId.value = 0;
    currentOrgName.value = '';
    localStorage.removeItem('token');
    localStorage.removeItem('currentOrgId');
    localStorage.removeItem('currentOrgName');
  }

  async function login(credentials: { username: string; password: string }) {
    const res = await loginApi(credentials);
    setToken(res.data.token);
    await fetchUser();
    await hydrateCurrentOrgName();
    router.push('/projects');
  }

  async function register(credentials: { username: string; password: string }) {
    await registerApi(credentials);
    // 注册完成后跳转到登录页，用户需手动登录
    router.push('/auth/login');
  }

  async function fetchUser() {
    const res = await getProfile();
    user.value = res.data;
  }

  async function hydrateCurrentOrgName() {
    // 兼容：老数据只有 orgId，没有 orgName（例如升级前已选过组织）
    if (!token.value) return;
    if (!currentOrgId.value) return;
    if (currentOrgName.value) return;
    try {
      const { getCurrentOrg } = await import('../api/org');
      const res = await getCurrentOrg();
      const org = res.data;
      if (org?.id && org?.name) {
        setCurrentOrg(org.id, org.name);
      }
    } catch (e) {
      // 静默失败：不影响页面，只是回显名可能缺失
      console.warn('hydrateCurrentOrgName failed', e);
    }
  }

  function logout() {
    clearAuth();
    router.push('/auth/login');
  }

  function setCurrentOrgId(orgId: number) {
    currentOrgId.value = orgId;
    localStorage.setItem('currentOrgId', String(orgId));
  }

  function setCurrentOrg(orgId: number, orgName: string) {
    currentOrgId.value = orgId;
    currentOrgName.value = orgName || '';
    localStorage.setItem('currentOrgId', String(orgId));
    localStorage.setItem('currentOrgName', currentOrgName.value);
  }

  // 初始化时若有 token 则拉取用户信息
  if (token.value) {
    fetchUser()
      .then(() => hydrateCurrentOrgName())
      .catch(() => clearAuth());
  }

  return { token, user, currentOrgId, currentOrgName, setCurrentOrgId, setCurrentOrg, login, register, fetchUser, hydrateCurrentOrgName, logout };
});
