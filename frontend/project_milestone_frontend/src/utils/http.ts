import axios from 'axios';
import { useAuthStore } from '../store/auth';

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

export default http;
