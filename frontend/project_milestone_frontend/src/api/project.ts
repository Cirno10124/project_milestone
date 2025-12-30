import http from '../utils/http';

export interface ProjectDto {
  id: number;
  name: string;
  description?: string;
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
