import { Module } from '@nestjs/common';
import { TaskService } from './task/task.service';
import { TaskController } from './task/task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { WbsItem } from '../wbs-item/entities/wbs-item.entity';
import { Project } from '../project/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskAssignee, ProjectMember, WbsItem, Project])],
  providers: [TaskService],
  controllers: [TaskController]
})
export class TaskModule {}
