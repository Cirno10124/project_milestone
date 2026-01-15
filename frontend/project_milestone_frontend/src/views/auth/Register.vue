<template>
  <div class="pm-auth-shell">
    <div class="pm-card pm-auth-card">
      <div class="pm-card__header">
        <h1 class="pm-title">注册</h1>
        <p class="pm-subtitle">创建账号后即可开始创建项目与任务</p>
      </div>
      <div class="pm-card__body">
        <form class="pm-form" @submit.prevent="onSubmit">
          <div class="pm-field">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="form.username"
              class="pm-input"
              type="text"
              autocomplete="username"
              required
            />
          </div>

          <div class="pm-field">
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="form.email"
              class="pm-input"
              type="email"
              autocomplete="email"
              required
            />
          </div>

          <div class="pm-code-row">
            <div class="pm-field">
              <label for="code">验证码</label>
              <input id="code" v-model="form.code" class="pm-input" type="text" required />
            </div>
            <PMButton
              variant="secondary"
              type="button"
              :disabled="sendingCode || cooldownLeft > 0"
              @click="onSendCode"
            >
              {{ cooldownLeft > 0 ? `重新发送(${cooldownLeft}s)` : '发送验证码' }}
            </PMButton>
          </div>

          <div class="pm-field">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="form.password"
              class="pm-input"
              type="password"
              autocomplete="new-password"
              required
            />
          </div>
          <div class="pm-field">
            <label for="confirm">确认密码</label>
            <input
              id="confirm"
              v-model="form.confirmPassword"
              class="pm-input"
              type="password"
              autocomplete="new-password"
              required
            />
          </div>

          <p v-if="error" class="pm-error">{{ error }}</p>

          <div class="pm-actions pm-actions--right">
            <PMButton variant="secondary" type="button" @click="goToLogin">返回登录</PMButton>
            <PMButton variant="primary" type="submit">注册</PMButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { sendEmailCode } from '@/api/auth';
import PMButton from '@/components/pm/PMButton.vue';
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

<style scoped></style>
