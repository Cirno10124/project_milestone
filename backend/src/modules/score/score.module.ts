import { Module } from '@nestjs/common';
import { ScoreService } from './score/score.service';
import { ScoreController } from './score/score.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Score } from './entities/score.entity';
import { Project } from '../project/entities/project.entity';
import { ProjectMember } from '../project/entities/project-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Score, Project, ProjectMember])],
  providers: [ScoreService],
  controllers: [ScoreController]
})
export class ScoreModule {}
