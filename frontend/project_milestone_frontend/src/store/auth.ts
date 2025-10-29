import { defineStore } from 'pinia';
import { login as loginApi, register as registerApi, getProfile } from '../api/auth';
import { ref } from 'vue';
import router from '../router';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '');
  const user = ref<any>(null);

  function setToken(t: string) {
    token.value = t;
    localStorage.setItem('token', t);
  }

  function clearAuth() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
  }

  async function login(credentials: { username: string; password: string }) {
    const res = await loginApi(credentials);
    setToken(res.data.token);
    await fetchUser();
    router.push('/projects');
  }

  async function register(credentials: { username: string; password: string }) {
    const res = await registerApi(credentials);
    setToken(res.data.token);
    await fetchUser();
    router.push('/projects');
  }

  async function fetchUser() {
    const res = await getProfile();
    user.value = res.data;
  }

  function logout() {
    clearAuth();
    router.push('/auth/login');
  }

  // 初始化时若有 token 则拉取用户信息
  if (token.value) {
    fetchUser().catch(() => clearAuth());
  }

  return { token, user, login, register, fetchUser, logout };
});
