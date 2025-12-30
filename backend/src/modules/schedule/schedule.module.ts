import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule/schedule.service';
import { ScheduleController } from './schedule/schedule.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleRun } from './schedule-run.entity';
import { ScheduleItem } from './schedule-item.entity';
import { Project } from '../project/entities/project.entity';
import { Task } from '../task/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleRun, ScheduleItem, Project, Task])],
  providers: [ScheduleService],
  controllers: [ScheduleController]
})
export class ScheduleModule {}
