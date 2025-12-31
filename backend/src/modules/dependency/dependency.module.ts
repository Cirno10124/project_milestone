import { Module } from '@nestjs/common';
import { DependencyService } from './dependency/dependency.service';
import { DependencyController } from './dependency/dependency.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dependency } from './dependency.entity';
import { Task } from '../task/entities/task.entity';
import { Project } from '../project/entities/project.entity';
import { ProjectMember } from '../project/entities/project-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dependency, Task, Project, ProjectMember])],
  providers: [DependencyService],
  controllers: [DependencyController]
})
export class DependencyModule {}
