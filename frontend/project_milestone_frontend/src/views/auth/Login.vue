<template>
  <div class="login-container">
    <h1>登录</h1>
    <form @submit.prevent="onSubmit">
      <div>
        <label for="username">用户名</label>
        <input id="username" v-model="credentials.username" type="text" required />
      </div>
      <div>
        <label for="password">密码</label>
        <input id="password" v-model="credentials.password" type="password" required />
      </div>
      <button type="submit">登录</button>
      <button type="button" @click="goToRegister">注册</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
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

<style scoped>
.login-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.login-container div {
  margin-bottom: 15px;
}
.login-container label {
  display: block;
  margin-bottom: 5px;
}
.login-container input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
</style>





