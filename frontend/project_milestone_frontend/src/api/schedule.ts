import http from '../utils/http';

export interface ScheduleItemDto {
  id: number;
  slack: number;
  earlyStart?: string;
  earlyFinish?: string;
  lateStart?: string;
  lateFinish?: string;
  task?: { id: number; name: string };
}

export interface ScheduleRunDto {
  id: number;
  runType: string;
  executedAt: string;
  items: ScheduleItemDto[];
}

export function computeSchedule(projectId: number, runType: 'initial' | 'rolling' = 'initial') {
  return http.post<ScheduleRunDto>('/schedule-runs/compute', { projectId, runType });
}

export function getLatestSchedule(projectId: number) {
  return http.get<ScheduleRunDto>('/schedule-runs/latest', { params: { projectId } });
}




