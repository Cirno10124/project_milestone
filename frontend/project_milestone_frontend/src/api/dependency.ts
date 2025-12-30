import http from '../utils/http';

export interface CreateDependencyDto {
  taskId: number;
  predecessorId: number;
  type?: 'FS' | 'SS' | 'FF' | 'SF';
  lag?: number;
}

/** 创建任务依赖 */
export function createDependency(dto: CreateDependencyDto) {
  return http.post('/dependencies', dto);
}
