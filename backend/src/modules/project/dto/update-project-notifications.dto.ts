import { IsIn, IsOptional, IsBoolean } from 'class-validator';
import type { ProjectNotifyScope } from '../entities/project.entity';

export class UpdateProjectNotificationsDto {
  @IsOptional()
  @IsBoolean()
  notifyTaskComplete?: boolean;

  @IsOptional()
  @IsIn(['admins', 'all'])
  notifyTaskCompleteScope?: ProjectNotifyScope;

  @IsOptional()
  @IsBoolean()
  notifyMilestoneComplete?: boolean;

  @IsOptional()
  @IsIn(['admins', 'all'])
  notifyMilestoneCompleteScope?: ProjectNotifyScope;
}

