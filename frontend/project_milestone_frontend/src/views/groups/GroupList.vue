<template>
  <div>
    <h2>部门管理</h2>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="create">
      <input v-model="newName" placeholder="新部门名称" />
      <button @click="create" :disabled="!newName">创建</button>
    </div>

    <div class="layout">
      <div class="col">
        <h3>部门列表</h3>
        <ul v-if="groups.length">
          <li v-for="g in groups" :key="g.id">
            <button @click="select(g.id)" :class="{ active: selectedGroupId === g.id }">{{ g.name }}</button>
          </li>
        </ul>
        <p v-else>暂无部门</p>
      </div>

      <div class="col" v-if="selectedGroupId">
        <h3>部门成员</h3>
        <div class="add">
          <select v-model.number="selectedUserId">
            <option :value="0" disabled>选择组织用户</option>
            <option v-for="u in orgUsers" :key="u.id" :value="u.id">{{ u.username }} (id={{ u.id }})</option>
          </select>
          <select v-model="selectedRole">
            <option value="member">member</option>
            <option value="admin">admin</option>
          </select>
          <button @click="add" :disabled="selectedUserId === 0">加入部门</button>
        </div>

        <ul v-if="members.length">
          <li v-for="m in members" :key="m.id">
            {{ m.username }} (id={{ m.id }}) - {{ m.role }}
            <button @click="remove(m.id)" style="margin-left: 8px;">移除</button>
          </li>
        </ul>
        <p v-else>暂无成员</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { createGroup, getGroups, addGroupMember, removeGroupMember } from '@/api/group';
import { getOrgUsers } from '@/api/org';

const groups = ref<Array<{ id: number; name: string }>>([]);
const members = ref<Array<{ id: number; username: string; role: 'admin' | 'member' }>>([]);
const orgUsers = ref<Array<{ id: number; username: string }>>([]);
const selectedGroupId = ref<number>(0);
const selectedUserId = ref<number>(0);
const selectedRole = ref<'admin' | 'member'>('member');
const newName = ref('');
const error = ref('');

async function loadGroups() {
  error.value = '';
  try {
    const res = await getGroups();
    groups.value = res.data || [];
  } catch (e) {
    console.error('加载部门失败', e);
    error.value = '加载部门失败（需要组织管理员权限才能创建/编辑）';
  }
}

async function loadOrgUsers() {
  try {
    const res = await getOrgUsers();
    orgUsers.value = (res.data || []).map((u) => ({ id: u.id, username: u.username }));
  } catch (e) {
    console.error('加载组织用户失败', e);
  }
}

async function loadMembers(groupId: number) {
  try {
    // 复用 group 的 members 接口：GET /groups/:id/members
    const res = await (await import('@/api/group')).getGroupMembers(groupId);
    members.value = res.data || [];
  } catch (e) {
    console.error('加载成员失败', e);
    members.value = [];
  }
}

async function create() {
  try {
    await createGroup({ name: newName.value });
    newName.value = '';
    await loadGroups();
  } catch (e) {
    console.error('创建部门失败', e);
    error.value = '创建部门失败（需要组织管理员权限）';
  }
}

async function select(id: number) {
  selectedGroupId.value = id;
  await loadMembers(id);
}

async function add() {
  if (!selectedGroupId.value) return;
  try {
    await addGroupMember({ groupId: selectedGroupId.value, userId: selectedUserId.value, role: selectedRole.value });
    await loadMembers(selectedGroupId.value);
  } catch (e) {
    console.error('加入部门失败', e);
    error.value = '加入部门失败（需要组织管理员权限）';
  }
}

async function remove(userId: number) {
  if (!selectedGroupId.value) return;
  try {
    await removeGroupMember(selectedGroupId.value, userId);
    await loadMembers(selectedGroupId.value);
  } catch (e) {
    console.error('移除失败', e);
    error.value = '移除失败（需要组织管理员权限）';
  }
}

onMounted(async () => {
  await Promise.all([loadGroups(), loadOrgUsers()]);
});
</script>

<style scoped>
.error { color: red; }
.create { display:flex; gap: 8px; margin: 12px 0; }
.layout { display:flex; gap: 24px; }
.col { min-width: 280px; }
.col ul { padding-left: 16px; }
.active { font-weight: bold; }
.add { display:flex; gap: 8px; margin: 10px 0; }
</style>
















