import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WbsItemService } from './wbs-item.service';
import { WbsItem } from '../entities/wbs-item.entity';
import { CreateWbsItemDto } from '../dto/create-wbs-item.dto';
import { UpdateWbsItemDto } from '../dto/update-wbs-item.dto';

describe('WbsItemService', () => {
  let service: WbsItemService;
  let repo: Partial<Repository<WbsItem>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation(dto => dto as any),
      save: jest.fn().mockResolvedValue({ id: 1, name: 'Node' }),
      find: jest.fn().mockResolvedValue([{ id: 1, name: 'Node' }]),
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Node' }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WbsItemService,
        { provide: getRepositoryToken(WbsItem), useValue: repo },
      ],
    }).compile();
    service = module.get<WbsItemService>(WbsItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should work', async () => {
    const dto: CreateWbsItemDto = { projectId: 1, name: 'Node', duration: 1 };
    const res = await service.create(dto);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 1, name: 'Node' });
  });

  it('findAll should return items', async () => {
    const res = await service.findAll();
    expect(repo.find).toHaveBeenCalled();
    expect(res).toEqual([{ id: 1, name: 'Node' }]);
  });
});
