import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

// 懒加载视图组件
const Login = () => import('../views/auth/Login.vue');
const Register = () => import('../views/auth/Register.vue');
const ProjectList = () => import('../views/projects/ProjectList.vue');
const GroupList = () => import('../views/groups/GroupList.vue');
const ProjectDetail = () => import('../views/projects/ProjectDetail.vue');

const routes = [
  { path: '/auth/login', component: Login },
  { path: '/auth/register', component: Register },
  { path: '/projects', component: ProjectList, meta: { requiresAuth: true } },
  { path: '/projects/:id', component: ProjectDetail, meta: { requiresAuth: true } },
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
  if ((to.path === '/auth/login' || to.path === '/auth/register') && auth.token) {
    return next('/projects');
  }
  next();
});

export default router;
