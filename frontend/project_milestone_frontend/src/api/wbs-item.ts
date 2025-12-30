import http from '../utils/http';
export interface WbsItemDto {
  id: number;
  projectId: number;
  parentId?: number;
  name: string;
  description?: string;
  duration: number;
}

export function getWbsItems(projectId: number) {
  return http.get<WbsItemDto[]>(`/wbs-items?projectId=${projectId}`);
}

export function createWbsItem(dto: {
  projectId: number;
  parentId?: number;
  name: string;
  description?: string;
  duration: number;
}) {
  return http.post<WbsItemDto>('/wbs-items', dto);
}
