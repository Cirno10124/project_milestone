<template>
  <div class="register-container">
    <h1>注册</h1>
    <form @submit.prevent="onSubmit">
      <div>
        <label for="username">邮箱/手机</label>
        <input id="username" v-model="form.username" type="text" required />
      </div>
      <div>
        <label for="password">密码</label>
        <input id="password" v-model="form.password" type="password" required />
      </div>
      <div>
        <label for="confirm">确认密码</label>
        <input id="confirm" v-model="form.confirmPassword" type="password" required />
      </div>
      <button type="submit">注册</button>
      <button type="button" @click="goToLogin">返回登录</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { defineOptions } from 'vue';
defineOptions({ name: 'RegisterPage' });

const form = reactive({ username: '', password: '', confirmPassword: '' });
const error = ref('');
const authStore = useAuthStore();
const router = useRouter();

async function onSubmit() {
  error.value = '';
  const username = form.username.trim();
  // 若全部为数字，则校验手机号格式
  if (/^\d+$/.test(username)) {
    if (!/^1\d{10}$/.test(username)) {
      error.value = '手机号格式不正确，需11位数字且以1开头';
      return;
    }
  } else {
    // 非纯数字则判断邮箱格式
    if (!username.includes('@')) {
      error.value = '账号格式不正确，需包含@符号';
      return;
    }
  }
  if (form.password !== form.confirmPassword) {
    error.value = '两次输入的密码不一致';
    return;
  }
  try {
    await authStore.register({ username: form.username, password: form.password });
    // 跳转到注册成功页面，几秒后再进入登录页
    router.push('/auth/register-success');
  } catch (e) {
    console.error('注册失败', e);
    error.value = '注册失败，请重试';
  }
}

function goToLogin() {
  router.push('/auth/login');
}
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.register-container div {
  margin-bottom: 15px;
}
.register-container label {
  display: block;
  margin-bottom: 5px;
}
.register-container input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
.error {
  color: red;
  margin-top: 10px;
}
</style>





