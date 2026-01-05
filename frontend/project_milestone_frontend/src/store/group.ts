import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as groupApi from '../api/group';

export const useGroupStore = defineStore('group', () => {
  const groups = ref<Array<any>>([]);
  const currentGroup = ref<any>(null);
  const members = ref<Array<any>>([]);

  async function fetchGroups() {
    const res = await groupApi.getGroups();
    groups.value = res.data;
  }

  async function createGroup(name: string) {
    const res = await groupApi.createGroup({ name });
    groups.value.push(res.data);
    return res.data;
  }

  async function updateGroup(id: number, dto: { name?: string }) {
    const res = await groupApi.updateGroup(id, dto);
    const idx = groups.value.findIndex(g => g.id === id);
    if (idx !== -1) groups.value[idx] = res.data;
    return res.data;
  }

  async function deleteGroup(id: number) {
    await groupApi.deleteGroup(id);
    groups.value = groups.value.filter(g => g.id !== id);
  }

  async function fetchMembers(groupId: number) {
    currentGroup.value = groupId;
    const res = await groupApi.getGroups(); // TODO: replace with API to get group members
    // Assuming API GET /groups/:id returns group with members
    const group = res.data.find((g: any) => g.id === groupId);
    members.value = group?.members || [];
  }

  async function addMember(groupId: number, userId: number, role: 'admin' | 'member') {
    const res = await groupApi.addGroupMember({ groupId, userId, role });
    members.value.push(res.data);
    return res.data;
  }

  async function removeMember(groupId: number, userId: number) {
    await groupApi.removeGroupMember(groupId, userId);
    members.value = members.value.filter(m => m.userId !== userId);
  }

  async function changeRole(groupId: number, userId: number, role: 'admin' | 'member') {
    const res = await groupApi.changeMemberRole({ groupId, userId, role });
    const idx = members.value.findIndex(m => m.userId === userId);
    if (idx !== -1) members.value[idx].role = role;
    return res.data;
  }

  return { groups, currentGroup, members, fetchGroups, createGroup, updateGroup, deleteGroup, fetchMembers, addMember, removeMember, changeRole };
});
