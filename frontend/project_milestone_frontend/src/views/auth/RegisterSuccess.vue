<template>
  <div class="pm-auth-shell">
    <div class="pm-card pm-auth-card">
      <div class="pm-card__header">
        <h1 class="pm-title">注册成功</h1>
        <p class="pm-subtitle">欢迎加入！马上带你进入登录页面</p>
      </div>
      <div class="pm-card__body">
        <div class="pm-stack" style="gap: var(--pm-space-3);">
          <PMAlert type="success" message="注册成功！5 秒后将自动跳转到登录页面…" />
          <div class="pm-actions pm-actions--right">
            <PMButton variant="primary" type="button" @click="router.push('/auth/login')">
              立即登录
            </PMButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PMButton from '@/components/pm/PMButton.vue';
import PMAlert from '@/components/pm/PMAlert.vue';

const router = useRouter();

onMounted(() => {
  setTimeout(() => {
    router.push('/auth/login');
  }, 5000);
});
</script>

<style scoped></style>
