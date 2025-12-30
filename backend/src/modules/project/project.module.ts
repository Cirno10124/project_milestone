import { Module } from '@nestjs/common';
import { ProjectService } from './project/project.service';
import { ProjectController } from './project/project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Task } from '../task/entities/task.entity';
import { WbsItem } from '../wbs-item/entities/wbs-item.entity';
import { ProjectMember } from './entities/project-member.entity';
import { OrgMember } from '../org/entities/org-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task, WbsItem, ProjectMember, OrgMember])],
  providers: [ProjectService],
  controllers: [ProjectController]
})
export class ProjectModule {}
