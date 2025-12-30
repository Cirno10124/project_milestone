import http from '../utils/http';

export interface TaskDto {
  id: number;
  wbsItemId: number;
  name: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  percentComplete?: number;
  predecessors?: Array<{ id: number }>;
  successors?: Array<{ id: number }>;
}

/** 获取项目下的所有任务 */
export function getTasksByProject(projectId: number) {
  return http.get<TaskDto[]>(`/tasks?projectId=${projectId}`);
}

/** 创建新任务 */
export function createTask(dto: { wbsItemId: number; name: string; duration?: number; startDate?: string; endDate?: string }) {
  return http.post<TaskDto>('/tasks', dto);
}

/** 更新任务 */
export function updateTask(id: number, dto: Partial<TaskDto>) {
  return http.patch<TaskDto>(`/tasks/${id}`, dto);
}
