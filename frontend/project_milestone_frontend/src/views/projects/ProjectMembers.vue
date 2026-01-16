<template>
  <div class="min-h-screen">
    <div class="max-w-5xl mx-auto px-4 py-10">
      <div class="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-semibold text-gray-900">项目成员管理</h2>
          <p class="text-sm text-gray-500 mt-1">为项目分配成员与角色。</p>
        </div>
        <PMButton variant="secondary" type="button" @click="goBackToProject">返回项目</PMButton>
      </div>

      <PMAlert v-if="error" type="error" :message="error" class="mb-4" />

      <PMAlert v-if="!isAdmin" type="warning" message="仅项目管理员可管理成员。" />

      <PMCard v-if="isAdmin" class="mb-6">
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
            <PMButton variant="primary" type="button" :disabled="selectedUserId === 0" @click="addMember">
              添加/更新
            </PMButton>
          </div>
        </div>
      </PMCard>

      <PMCard>
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">共 {{ members.length }} 人</div>
        </div>

        <div class="mt-4 overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">用户</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">角色</th>
                <th v-if="isAdmin" class="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="m in members"
                :key="m.id"
                class="hover:bg-gray-50 transition-colors duration-150"
              >
                <td class="px-4 py-3 text-sm text-gray-700">{{ m.username }} (id={{ m.id }})</td>
                <td class="px-4 py-3 text-sm text-gray-700">
                  <span v-if="!isAdmin">{{ m.role }}</span>
                  <select
                    v-else
                    v-model="m.role"
                    class="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    @change="updateRole(m)"
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td v-if="isAdmin" class="px-4 py-3 text-sm">
                  <PMButton variant="danger" type="button" @click="remove(m.id)">移除</PMButton>
                </td>
              </tr>
              <tr v-if="members.length === 0">
                <td
                  :colspan="isAdmin ? 3 : 2"
                  class="px-4 py-8 text-center text-sm text-gray-500"
                >
                  暂无成员
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PMCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { addProjectMember, getProject, getProjectMembers, removeProjectMember, changeProjectMemberRole } from '@/api/project';
import { getOrgUsers } from '@/api/org';
import PMButton from '@/components/pm/PMButton.vue';
import PMAlert from '@/components/pm/PMAlert.vue';
import PMCard from '@/components/pm/PMCard.vue';
import PMFormField from '@/components/pm/PMFormField.vue';

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
<style scoped></style>