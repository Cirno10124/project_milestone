import { Test, TestingModule } from '@nestjs/testing';
import { ScoreService } from './score.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Score } from '../entities/score.entity';
import { Project } from '../../project/entities/project.entity';
import { Repository } from 'typeorm';
import { ProjectMember } from '../../project/entities/project-member.entity';

describe('ScoreService', () => {
  let service: ScoreService;
  let scoreRepo: Partial<Repository<Score>>;
  let projectRepo: Partial<Repository<Project>>;

  beforeEach(async () => {
    scoreRepo = { create: jest.fn(), save: jest.fn(), };
    projectRepo = { findOne: jest.fn().mockResolvedValue({ id: 1 }), };
    const noopRepo = {};
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreService,
        { provide: getRepositoryToken(Score), useValue: scoreRepo },
        { provide: getRepositoryToken(Project), useValue: projectRepo },
        { provide: getRepositoryToken(ProjectMember), useValue: noopRepo },
      ],
    }).compile();

    service = module.get<ScoreService>(ScoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
