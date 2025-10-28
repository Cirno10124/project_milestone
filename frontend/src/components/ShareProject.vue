<template>
  <div class="share-project">
    <h3>分享项目</h3>
    <div>
      <label>选择用户组：</label>
      <select v-model="selectedGroup">
        <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
    </div>
    <div>
      <label>角色：</label>
      <label><input type="radio" v-model="role" value="admin" /> 管理员</label>
      <label><input type="radio" v-model="role" value="member" /> 成员</label>
    </div>
    <button @click="share">确定分享</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGroupStore } from '../store/group';
import { shareProject } from '../api/project';
import { useRoute } from 'vue-router';

const groupStore = useGroupStore();
const groups = ref([] as Array<{ id: number; name: string }>);
const selectedGroup = ref<number | null>(null);
const role = ref<'admin' | 'member'>('member');
const route = useRoute();

onMounted(async () => {
  await groupStore.fetchGroups();
  groups.value = groupStore.groups;
  if (groups.value.length) selectedGroup.value = groups.value[0].id;
});

async function share() {
  if (!selectedGroup.value) return;
  const projectId = Number(route.params.id);
  await shareProject({ projectId, groupId: selectedGroup.value, role: role.value });
  alert('分享成功');
}
</script>

<style scoped>
.share-project { border: 1px solid #ccc; padding: 1rem; margin: 1rem 0; }
</style>
