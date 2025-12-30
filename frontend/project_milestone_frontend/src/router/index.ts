import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

// 懒加载视图组件
const Login = () => import('../views/auth/Login.vue');
const Register = () => import('../views/auth/Register.vue');
const RegisterSuccess = () => import('../views/auth/RegisterSuccess.vue');
const ProjectList = () => import('../views/projects/ProjectList.vue');
const ProjectCreate = () => import('../views/projects/ProjectCreate.vue');
const GroupList = () => import('../views/groups/GroupList.vue');
const ProjectDetail = () => import('../views/projects/ProjectDetail.vue');
const ProjectMembers = () => import('../views/projects/ProjectMembers.vue');
const OrgSelect = () => import('../views/org/OrgSelect.vue');

const routes = [
  { path: '/auth/login', component: Login },
  { path: '/auth/register', component: Register },
  { path: '/auth/register-success', component: RegisterSuccess },
  { path: '/org/select', component: OrgSelect, meta: { requiresAuth: true } },
  { path: '/projects', component: ProjectList, meta: { requiresAuth: true } },
  { path: '/projects/create', component: ProjectCreate, meta: { requiresAuth: true } },
  { path: '/projects/:id', component: ProjectDetail, meta: { requiresAuth: true } },
  { path: '/projects/:id/members', component: ProjectMembers, meta: { requiresAuth: true } },
  { path: '/groups', component: GroupList, meta: { requiresAuth: true } },
  { path: '/', redirect: '/projects' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.token) {
    return next('/auth/login');
  }
  if (to.meta.requiresAuth && auth.token && !auth.currentOrgId && to.path !== '/org/select') {
    return next('/org/select');
  }
  if ((to.path === '/auth/login' || to.path === '/auth/register') && auth.token) {
    return next('/projects');
  }
  next();
});

export default router;
