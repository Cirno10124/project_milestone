import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DependencyService } from './dependency.service';
import { Dependency } from '../dependency.entity';
import { CreateDependencyDto } from '../dto/create-dependency.dto';
import { UpdateDependencyDto } from '../dto/update-dependency.dto';

describe('DependencyService', () => {
  let service: DependencyService;
  let repo: Partial<Repository<Dependency>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation(dto => dto as any),
      save: jest.fn().mockResolvedValue({ id: 1 }),
      find: jest.fn().mockResolvedValue([{ id: 1 }]),
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DependencyService,
        { provide: getRepositoryToken(Dependency), useValue: repo },
      ],
    }).compile();
    service = module.get<DependencyService>(DependencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create works', async () => {
    const dto: CreateDependencyDto = { taskId: 1, predecessorId: 2 };
    const res = await service.create(dto);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 1 });
  });
});
