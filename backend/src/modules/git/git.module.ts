import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitController } from './git.controller';
import { GitService } from './git.service';
import { Project } from '../project/entities/project.entity';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project]), TaskModule],
  controllers: [GitController],
  providers: [GitService],
})
export class GitModule {}


