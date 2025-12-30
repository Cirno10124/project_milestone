import http from '../utils/http';

export interface OrgDto {
  id: number;
  name: string;
  roleInOrg?: 'org_admin' | 'org_member';
}

export function getOrgs() {
  return http.get<OrgDto[]>('/orgs');
}

export function createOrg(dto: { name: string }) {
  return http.post<OrgDto>('/orgs', dto);
}

export function getOrgUsers() {
  return http.get<Array<{ id: number; username: string; roleInOrg: string; groupId: number | null; roleInGroup: string }>>('/orgs/users');
}

// 当前选中组织（依赖 X-Org-Id）
export function getCurrentOrg() {
  return http.get<OrgDto>('/orgs/current');
}


