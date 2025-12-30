<template>
  <div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <button @click="goBackToProject">返回项目</button>
      <h2 style="margin: 0;">项目成员管理</h2>
    </div>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="!isAdmin" class="hint">仅项目管理员可管理成员。</div>

    <div v-if="isAdmin" class="add-form">
      <select v-model.number="selectedUserId">
        <option :value="0" disabled>选择组织用户</option>
        <option v-for="u in orgUsers" :key="u.id" :value="u.id">{{ u.username }} (id={{ u.id }})</option>
      </select>
      <select v-model="selectedRole">
        <option value="member">member</option>
        <option value="admin">admin</option>
      </select>
      <button @click="addMember" :disabled="selectedUserId === 0">添加/更新</button>
    </div>

    <table v-if="members.length" class="table">
      <thead>
        <tr>
          <th>用户</th>
          <th>角色</th>
          <th v-if="isAdmin">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in members" :key="m.id">
          <td>{{ m.username }} (id={{ m.id }})</td>
          <td>
            <span v-if="!isAdmin">{{ m.role }}</span>
            <select v-else v-model="m.role" @change="updateRole(m)">
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
          </td>
          <td v-if="isAdmin">
            <button @click="remove(m.id)">移除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else>暂无成员</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { addProjectMember, getProject, getProjectMembers, removeProjectMember, changeProjectMemberRole } from '@/api/project';
import { getOrgUsers } from '@/api/org';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => Number(route.params.id));

const members = ref<Array<{ id: number; username: string; role: 'admin' | 'member' }>>([]);
const orgUsers = ref<Array<{ id: number; username: string }>>([]);
const error = ref('');

const isAdmin = ref(false);
const selectedUserId = ref(0);
const selectedRole = ref<'admin' | 'member'>('member');

function goBackToProject() {
  router.push(`/projects/${projectId.value}`);
}

async function load() {
  error.value = '';
  try {
    const proj = await getProject(projectId.value);
    isAdmin.value = proj.data?.role === 'admin';
    const res = await getProjectMembers(projectId.value);
    members.value = res.data || [];
    const usersRes = await getOrgUsers();
    orgUsers.value = usersRes.data?.map((u) => ({ id: u.id, username: u.username })) || [];
  } catch (e) {
    console.error('加载成员失败', e);
    error.value = '加载成员失败';
  }
}

async function addMember() {
  try {
    await addProjectMember(projectId.value, { userId: selectedUserId.value, role: selectedRole.value });
    await load();
  } catch (e) {
    console.error('添加成员失败', e);
    error.value = '添加成员失败';
  }
}

async function updateRole(m: { id: number; role: 'admin' | 'member' }) {
  try {
    await changeProjectMemberRole(projectId.value, m.id, m.role);
  } catch (e) {
    console.error('更新角色失败', e);
    error.value = '更新角色失败';
  }
}

async function remove(userId: number) {
  try {
    await removeProjectMember(projectId.value, userId);
    await load();
  } catch (e) {
    console.error('移除失败', e);
    error.value = '移除失败';
  }
}

onMounted(load);
</script>

<style scoped>
.error { color: red; }
.hint { color: #666; margin: 8px 0; }
.add-form { display: flex; gap: 8px; margin: 12px 0; }
.table { border-collapse: collapse; }
.table th, .table td { border: 1px solid #ddd; padding: 6px 10px; }
</style>


