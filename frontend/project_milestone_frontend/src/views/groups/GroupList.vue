<template>
  <div class="min-h-screen">
    <div class="max-w-6xl mx-auto px-4 py-10">
      <div class="mb-6">
        <h2 class="text-2xl font-semibold text-gray-900">部门管理</h2>
        <p class="text-sm text-gray-500 mt-1">在组织内创建部门，并管理部门成员。</p>
      </div>

      <PMAlert v-if="error" type="error" :message="error" class="mb-4" />

      <PMCard class="mb-6">
        <div class="flex items-end justify-between gap-4">
          <div class="flex-1">
            <PMFormField label="新建部门" required helpText="需要组织管理员权限。">
              <PMInput v-model="newName" placeholder="新部门名称" />
            </PMFormField>
          </div>
          <div class="shrink-0">
            <PMButton variant="primary" type="button" :disabled="!newName" @click="create">
              创建
            </PMButton>
          </div>
        </div>
      </PMCard>

      <PMCard class="mb-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">组织成员管理</h3>
          <span class="text-sm text-gray-500">{{ orgUsers.length }} 人</span>
        </div>

        <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <PMFormField label="按用户名邀请" required helpText="组织管理员可添加用户到当前组织。">
            <PMInput v-model="inviteUsername" placeholder="输入用户名" />
          </PMFormField>
          <div class="flex justify-end md:col-span-2">
            <PMButton variant="primary" type="button" :disabled="!inviteUsername" @click="invite">
              加入组织
            </PMButton>
          </div>
        </div>

        <p v-if="orgUsers.length === 0" class="mt-4 text-sm text-gray-500">当前组织暂无成员。</p>
        <div v-else class="mt-4 text-sm text-gray-600">
          当前成员：
          <span v-for="(u, idx) in orgUsers" :key="u.id">
            {{ u.username }}<span v-if="idx < orgUsers.length - 1">、</span>
          </span>
        </div>
      </PMCard>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <PMCard>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">部门列表</h3>
            <span class="text-sm text-gray-500">{{ groups.length }} 个</span>
          </div>

          <div v-if="groups.length" class="mt-4 divide-y divide-gray-200">
            <button
              v-for="g in groups"
              :key="g.id"
              type="button"
              class="w-full text-left py-3 flex items-center justify-between gap-3 hover:bg-gray-50 rounded-lg px-2"
              :class="selectedGroupId === g.id ? 'bg-blue-50' : ''"
              @click="select(g.id)"
            >
              <div class="min-w-0">
                <div class="font-medium text-gray-900 truncate">{{ g.name }}</div>
                <div class="text-xs text-gray-500">部门 ID：{{ g.id }}</div>
              </div>
              <PMButton variant="ghost" type="button" @click.stop="select(g.id)">
                {{ selectedGroupId === g.id ? '已选择' : '选择' }}
              </PMButton>
            </button>
          </div>
          <p v-else class="mt-4 text-sm text-gray-500">暂无部门</p>
        </PMCard>

        <PMCard>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">部门成员</h3>
            <span class="text-sm text-gray-500">
              {{ selectedGroupId ? `${members.length} 人` : '未选择部门' }}
            </span>
          </div>

          <PMAlert v-if="!selectedGroupId" type="info" message="请先在左侧选择一个部门。" class="mt-4" />

          <div v-else class="mt-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <PMFormField label="选择组织用户" required>
                <select
                  v-model.number="selectedUserId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option :value="0" disabled>选择组织用户</option>
                  <option v-for="u in orgUsers" :key="u.id" :value="u.id">
                    {{ u.username }} (id={{ u.id }})
                  </option>
                </select>
              </PMFormField>

              <PMFormField label="角色" required>
                <select
                  v-model="selectedRole"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
              </PMFormField>

              <div class="flex justify-end">
                <PMButton variant="primary" type="button" :disabled="selectedUserId === 0" @click="add">
                  加入部门
                </PMButton>
              </div>
            </div>

            <div class="mt-6 overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">用户</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">角色</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr
                    v-for="m in members"
                    :key="m.id"
                    class="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td class="px-4 py-3 text-sm text-gray-700">
                      {{ m.username }} (id={{ m.id }})
                    </td>
                    <td class="px-4 py-3 text-sm">
                      <PMTag :color="m.role === 'admin' ? 'blue' : 'gray'">{{ m.role }}</PMTag>
                    </td>
                    <td class="px-4 py-3 text-sm">
                      <PMButton variant="danger" type="button" @click="remove(m.id)">移除</PMButton>
                    </td>
                  </tr>
                  <tr v-if="members.length === 0">
                    <td colspan="3" class="px-4 py-8 text-center text-sm text-gray-500">暂无成员</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </PMCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { createGroup, getGroups, addGroupMember, removeGroupMember } from '@/api/group';
import { addOrgUser, getOrgUsers } from '@/api/org';
import PMAlert from '@/components/pm/PMAlert.vue';
import PMButton from '@/components/pm/PMButton.vue';
import PMCard from '@/components/pm/PMCard.vue';
import PMFormField from '@/components/pm/PMFormField.vue';
import PMInput from '@/components/pm/PMInput.vue';
import PMTag from '@/components/pm/PMTag.vue';

const groups = ref<Array<{ id: number; name: string }>>([]);
const members = ref<Array<{ id: number; username: string; role: 'admin' | 'member' }>>([]);
const orgUsers = ref<Array<{ id: number; username: string }>>([]);
const selectedGroupId = ref<number>(0);
const selectedUserId = ref<number>(0);
const selectedRole = ref<'admin' | 'member'>('member');
const newName = ref('');
const inviteUsername = ref('');
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

async function invite() {
  const username = inviteUsername.value.trim();
  if (!username) return;
  try {
    await addOrgUser({ username });
    inviteUsername.value = '';
    await loadOrgUsers();
  } catch (e) {
    console.error('加入组织失败', e);
    error.value = '加入组织失败（需要组织管理员权限）';
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

<style scoped></style>
















