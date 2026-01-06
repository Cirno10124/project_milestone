<template>
  <div class="register-container">
    <h1>注册</h1>
    <form @submit.prevent="onSubmit">
      <div>
        <label for="username">用户名</label>
        <input id="username" v-model="form.username" type="text" required />
      </div>
      <div>
        <label for="email">邮箱</label>
        <input id="email" v-model="form.email" type="email" required />
      </div>
      <div class="code-row">
        <div class="code-input">
          <label for="code">验证码</label>
          <input id="code" v-model="form.code" type="text" required />
        </div>
        <button type="button" class="code-btn" :disabled="sendingCode || cooldownLeft > 0" @click="onSendCode">
          {{ cooldownLeft > 0 ? `重新发送(${cooldownLeft}s)` : '发送验证码' }}
        </button>
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
import { reactive, ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { sendEmailCode } from '@/api/auth';
import { defineOptions } from 'vue';
defineOptions({ name: 'RegisterPage' });

const form = reactive({ username: '', email: '', code: '', password: '', confirmPassword: '' });
const error = ref('');
const authStore = useAuthStore();
const router = useRouter();
const sendingCode = ref(false);
const cooldownLeft = ref(0);
let cooldownTimer: number | null = null;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function startCooldown(seconds: number) {
  if (cooldownTimer) window.clearInterval(cooldownTimer);
  cooldownLeft.value = seconds;
  cooldownTimer = window.setInterval(() => {
    cooldownLeft.value -= 1;
    if (cooldownLeft.value <= 0 && cooldownTimer) {
      window.clearInterval(cooldownTimer);
      cooldownTimer = null;
      cooldownLeft.value = 0;
    }
  }, 1000);
}

onUnmounted(() => {
  if (cooldownTimer) window.clearInterval(cooldownTimer);
});

async function onSendCode() {
  error.value = '';
  const email = form.email.trim();
  if (!isValidEmail(email)) {
    error.value = '邮箱格式不正确';
    return;
  }
  try {
    sendingCode.value = true;
    await sendEmailCode({ email, purpose: 'register' });
    startCooldown(60);
  } catch (e) {
    console.error('发送验证码失败', e);
    error.value = '发送验证码失败，请稍后重试';
  } finally {
    sendingCode.value = false;
  }
}

async function onSubmit() {
  error.value = '';
  const username = form.username.trim();
  if (!username) {
    error.value = '用户名不能为空';
    return;
  }
  const email = form.email.trim();
  if (!isValidEmail(email)) {
    error.value = '邮箱格式不正确';
    return;
  }
  const code = form.code.trim();
  if (!code) {
    error.value = '请输入验证码';
    return;
  }
  if (form.password !== form.confirmPassword) {
    error.value = '两次输入的密码不一致';
    return;
  }
  try {
    await authStore.register({ username, email, code, password: form.password });
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
.code-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
.code-input {
  flex: 1;
}
.code-btn {
  height: 34px;
  padding: 0 12px;
  white-space: nowrap;
}
.error {
  color: red;
  margin-top: 10px;
}
</style>





