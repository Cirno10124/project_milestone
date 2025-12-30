import http from '../utils/http';

export interface CreateGroupDto {
  name: string;
}
export interface UpdateGroupDto {
  name?: string;
}
export interface AddMemberDto {
  groupId: number;
  userId: number;
  role: 'admin' | 'member';
}
export interface ChangeMemberRoleDto {
  groupId: number;
  userId: number;
  role: 'admin' | 'member';
}

export function getGroups() {
  return http.get('/groups');
}

export function createGroup(dto: CreateGroupDto) {
  return http.post('/groups', dto);
}

export function updateGroup(id: number, dto: UpdateGroupDto) {
  return http.patch(`/groups/${id}`, dto);
}

export function deleteGroup(id: number) {
  return http.delete(`/groups/${id}`);
}

export function addGroupMember(dto: AddMemberDto) {
  return http.post(`/groups/${dto.groupId}/members`, {
    userId: dto.userId,
    role: dto.role,
  });
}

export function removeGroupMember(groupId: number, userId: number) {
  return http.delete(`/groups/${groupId}/members/${userId}`);
}

export function getGroupMembers(groupId: number) {
  return http.get<Array<{ id: number; username: string; role: 'admin' | 'member' }>>(`/groups/${groupId}/members`);
}

export function changeMemberRole(dto: ChangeMemberRoleDto) {
  return http.patch(`/groups/${dto.groupId}/members/${dto.userId}/role`, {
    role: dto.role,
  });
}
