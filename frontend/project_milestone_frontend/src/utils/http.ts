import axios from 'axios';
import { useAuthStore } from '../store/auth';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
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
