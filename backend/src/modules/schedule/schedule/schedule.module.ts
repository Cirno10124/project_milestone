import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleRun } from '../schedule-run.entity';
import { ScheduleItem } from '../schedule-item.entity';
import { Project } from '../../project/entities/project.entity';
import { Task } from '../../task/entities/task.entity';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleRun, ScheduleItem, Project, Task])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}



