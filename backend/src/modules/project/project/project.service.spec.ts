import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectService } from './project.service';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: getRepositoryToken(Project), useValue: repo },
      ],
    }).compile();
    service = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should call repository and return project', async () => {
    const dto: CreateProjectDto = { name: 'Test' };
    const res = await service.create(dto);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 1, name: 'Test' });
  });

  it('findAll should return array', async () => {
    const res = await service.findAll();
    expect(repo.find).toHaveBeenCalled();
    expect(res).toEqual([{ id: 1, name: 'Test' }]);
  });
});
