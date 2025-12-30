import http from '../utils/http';

export interface ProjectDto {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  role?: 'admin' | 'member';
}

export interface ShareProjectDto {
  projectId: number;
  groupId: number;
  role: 'admin' | 'member';
}

export function getProjects() {
  return http.get<ProjectDto[]>('/projects');
}

export function getProject(id: number) {
  return http.get<ProjectDto>(`/projects/${id}`);
}

export function getProjectMembers(projectId: number) {
  return http.get<Array<{ id: number; username: string; role: 'admin' | 'member' }>>(`/projects/${projectId}/members`);
}

export function addProjectMember(projectId: number, dto: { userId: number; role: 'admin' | 'member' }) {
  return http.post(`/projects/${projectId}/members`, dto);
}

export function changeProjectMemberRole(projectId: number, userId: number, role: 'admin' | 'member') {
  return http.patch(`/projects/${projectId}/members/${userId}/role`, { role });
}

export function removeProjectMember(projectId: number, userId: number) {
  return http.delete(`/projects/${projectId}/members/${userId}`);
}

export function shareProject(dto: ShareProjectDto) {
  return http.post('/projects/' + dto.projectId + '/share', {
    groupId: dto.groupId,
    role: dto.role,
  });
}

/**
 * 创建新项目
 * @param dto 包含 name 和 description
 */
export function createProject(dto: { name: string; description?: string }) {
  return http.post<ProjectDto>('/projects', dto);
}

/**
 * 更新项目开始日期
 */
export function updateProjectStartDate(id: number, startDate: string) {
  return http.patch<ProjectDto>(`/projects/${id}`, { startDate });
}

/**
 * 导出甘特图
 */
export function exportGantt(projectId: number) {
  return http.get(`/projects/${projectId}/gantt/export`, {
    responseType: 'blob',
  });
}

/**
 * 获取甘特图数据（用于预览）
 */
export function getGanttData(projectId: number) {
  return http.get(`/projects/${projectId}/gantt`);
}
