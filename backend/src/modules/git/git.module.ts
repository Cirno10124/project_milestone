import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitController } from './git.controller';
import { GitService } from './git.service';
import { Project } from '../project/entities/project.entity';
import { Task } from '../task/entities/task.entity';
import { TaskService } from '../task/task/task.service';
import { TaskAssignee } from '../task/entities/task-assignee.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { WbsItem } from '../wbs-item/entities/wbs-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task, TaskAssignee, ProjectMember, WbsItem])],
  controllers: [GitController],
  providers: [GitService, TaskService],
})
export class GitModule {}


