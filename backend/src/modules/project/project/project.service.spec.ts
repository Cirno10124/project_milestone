import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectService } from './project.service';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { Task } from '../../task/entities/task.entity';
import { WbsItem } from '../../wbs-item/entities/wbs-item.entity';
import { ProjectMember } from '../entities/project-member.entity';
import { OrgMember } from '../../org/entities/org-member.entity';

describe('ProjectService', () => {
  let service: ProjectService;
  let repo: Partial<Repository<Project>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation(dto => dto as any),
      save: jest.fn().mockResolvedValue({ id: 1, name: 'Test' }),
      find: jest.fn().mockResolvedValue([{ id: 1, name: 'Test' }]),
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Test' }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const noopRepo = { findOne: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: getRepositoryToken(Project), useValue: repo },
        { provide: getRepositoryToken(Task), useValue: noopRepo },
        { provide: getRepositoryToken(WbsItem), useValue: noopRepo },
        { provide: getRepositoryToken(ProjectMember), useValue: { ...noopRepo, create: jest.fn(), find: jest.fn(), findOne: jest.fn() } },
        { provide: getRepositoryToken(OrgMember), useValue: { findOne: jest.fn().mockResolvedValue({ id: 1 }) } },
      ],
    }).compile();
    service = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should call repository and return project', async () => {
    const dto: CreateProjectDto = { name: 'Test' };
    const res = await service.create(dto, 1, 1, true);
    expect(repo.create).toHaveBeenCalledWith({ ...dto, orgId: 1 });
    expect(repo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 1, name: 'Test' });
  });

  it('findAll should return array', async () => {
    const res = await service.findAll(1, 1, true);
    expect(repo.find).toHaveBeenCalled();
    expect(res).toEqual([{ id: 1, name: 'Test', role: 'admin' }]);
  });
});
