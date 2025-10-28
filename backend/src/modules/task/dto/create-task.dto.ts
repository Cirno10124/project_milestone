export class CreateTaskDto {
  wbsItemId: number;
  name: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  percentComplete?: number;
}



