import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleRun } from './entities/schedule-run.entity';
import { ScheduleItem } from './entities/schedule-item.entity';
import { Project } from '../../project/entities/project.entity';
import { Task } from '../../task/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleRun, ScheduleItem, Project, Task])],
  controllers: [],
  providers: [],
})
export class ScheduleModule {}



