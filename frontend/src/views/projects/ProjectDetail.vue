<template>
  <div>
    <h2>项目详情 - {{ project.name }}</h2>
    <p>{{ project.description }}</p>
    <!-- WBS 操作，仅管理员可见 -->
    <PermissionWrapper :allowed="isAdmin">
      <button @click="addWbsNode">添加 WBS 节点</button>
    </PermissionWrapper>
    <ShareProject />
    <!-- 其它项目详情，如甘特图、WBS 等 -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getProject } from '../../api/project';
import { useRoute } from 'vue-router';
import PermissionWrapper from '../../components/PermissionWrapper.vue';
import ShareProject from '../../components/ShareProject.vue';

const route = useRoute();
const project = ref<any>({ name: '', description: '' });

onMounted(async () => {
  const id = Number(route.params.id);
  const res = await getProject(id);
  project.value = res.data;
});

// 假设 API 返回 project.role 为 'admin' 或 'member'
const isAdmin = computed(() => project.value.role === 'admin');

function addWbsNode() {
  // 跳转或弹窗添加 WBS 节点逻辑
  alert('添加 WBS 节点 - 管理员权限');
}
</script>
