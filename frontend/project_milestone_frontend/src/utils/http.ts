import axios from 'axios';
import { useAuthStore } from '../store/auth';
import router from '../router';

const defaultBaseURL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000';

const http = axios.create({
  // 优先使用 .env 中的 VITE_API_URL；否则默认走“当前前端域名/IP + :3000”
  // 这样当你用局域网 IP 访问前端时，不会误打到访问端设备自己的 localhost。
  baseURL: import.meta.env.VITE_API_URL || defaultBaseURL,
});

http.interceptors.request.use(config => {
  const auth = useAuthStore();
  const token = auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const orgId = auth.currentOrgId;
  if (orgId) config.headers['X-Org-Id'] = String(orgId);
  return config;
});

http.interceptors.response.use(
  res => res,
  async err => {
    const auth = useAuthStore();
    const status: number | undefined = err?.response?.status;
    const msg: string =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      '';

    // JWT 失效/未登录：清理本地状态并回到登录页
    if (status === 401) {
      auth.logout();
      return Promise.reject(err);
    }

    // 组织上下文缺失/不属于该组织：引导重新选择组织
    if (
      status === 400 &&
      (String(msg).includes('缺少 X-Org-Id') ||
        String(msg).includes('非法 X-Org-Id'))
    ) {
      auth.setCurrentOrgId(0);
      if (router.currentRoute.value.path !== '/org/select') {
        await router.push('/org/select');
      }
      return Promise.reject(err);
    }
    if (status === 403 && String(msg).includes('不属于该组织')) {
      auth.setCurrentOrgId(0);
      if (router.currentRoute.value.path !== '/org/select') {
        await router.push('/org/select');
      }
      return Promise.reject(err);
    }

    return Promise.reject(err);
  },
);

export default http;
