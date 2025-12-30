<template>
  <div class="create-container">
    <h2>新建项目</h2>
    <form @submit.prevent="onSubmit">
      <div>
        <label for="name">项目名称</label>
        <input id="name" v-model="form.name" type="text" required />
      </div>
      <div>
        <label for="description">描述</label>
        <textarea id="description" v-model="form.description"></textarea>
      </div>
      <button type="submit">创建</button>
      <button type="button" @click="cancel">取消</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { createProject } from '@/api/project';

const router = useRouter();
const authStore = useAuthStore();
const form = reactive({ name: '', description: '' });
const error = ref('');

async function onSubmit() {
  error.value = '';
  try {
    const res = await createProject(form);
    router.push(`/projects/${res.data.id}`);
  } catch (e) {
    console.error('创建失败', e);
    error.value = '创建失败，请重试';
  }
}

function cancel() {
  router.back();
}
</script>

<style scoped>
.create-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.create-container div {
  margin-bottom: 15px;
}
.create-container label {
  display: block;
  margin-bottom: 5px;
}
.create-container input,
.create-container textarea {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
.error {
  color: red;
  margin-top: 10px;
}
</style>
