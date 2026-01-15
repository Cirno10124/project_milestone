<template>
  <div class="pm-auth-shell">
    <div class="pm-card pm-auth-card">
      <div class="pm-card__header">
        <h1 class="pm-title">登录</h1>
        <p class="pm-subtitle">使用你的账号进入项目管理系统</p>
      </div>
      <div class="pm-card__body">
        <form class="pm-form" @submit.prevent="onSubmit">
          <div class="pm-field">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="credentials.username"
              class="pm-input"
              type="text"
              autocomplete="username"
              required
            />
          </div>
          <div class="pm-field">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="credentials.password"
              class="pm-input"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>
          <div class="pm-actions pm-actions--right">
            <PMButton variant="secondary" type="button" @click="goToRegister">注册</PMButton>
            <PMButton variant="primary" type="submit">登录</PMButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import PMButton from '@/components/pm/PMButton.vue';
// 指定组件名，解决单词组件命名规则
import { defineOptions } from 'vue';
defineOptions({ name: 'LoginPage' });

const authStore = useAuthStore();
const credentials = reactive({ username: '', password: '' });
const router = useRouter();

async function onSubmit() {
  try {
    await authStore.login(credentials);
  } catch (error) {
    console.error('登录失败', error);
    // TODO: 添加错误提示
  }
}

function goToRegister() {
  router.push('/auth/register');
}
</script>

<style scoped></style>





