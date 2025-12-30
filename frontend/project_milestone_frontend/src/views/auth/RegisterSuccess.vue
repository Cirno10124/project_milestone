<template>
  <div class="success-container">
    <h1>注册成功！</h1>
    <p>5秒后将跳转到登录页面...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  setTimeout(() => {
    router.push('/auth/login');
  }, 5000);
});
</script>

<style scoped>
.success-container {
  text-align: center;
  margin-top: 100px;
}
.success-container h1 {
  color: #42b983;
}
</style>
