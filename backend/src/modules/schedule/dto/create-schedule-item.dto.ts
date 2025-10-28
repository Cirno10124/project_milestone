export class CreateScheduleItemDto {
  scheduleRunId: number;
  taskId: number;
  earlyStart?: string;
  earlyFinish?: string;
  lateStart?: string;
  lateFinish?: string;
  slack?: number;
}



