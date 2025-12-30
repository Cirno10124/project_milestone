import http from '../utils/http';
export interface WbsItemDto {
  id: number;
  projectId: number;
  parentId?: number;
  name: string;
  description?: string;
  duration: number;
  seq?: number;
}

export function getWbsItems(projectId: number) {
  return http.get<WbsItemDto[]>(`/wbs-items?projectId=${projectId}`);
}

/** 更新 WBS 节点 */
export function updateWbsItem(id: number, dto: { seq?: number; duration?: number }) {
  return http.patch<WbsItemDto>(`/wbs-items/${id}`, dto);
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
