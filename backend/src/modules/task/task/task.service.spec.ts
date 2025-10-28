import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskService } from './task.service';
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

describe('TaskService', () => {
  let service: TaskService;
  let repo: Partial<Repository<Task>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation(dto => dto as any),
      save: jest.fn().mockResolvedValue({ id: 1, name: 'Task' }),
      find: jest.fn().mockResolvedValue([{ id: 1, name: 'Task' }]),
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Task' }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: getRepositoryToken(Task), useValue: repo },
      ],
    }).compile();
    service = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create works', async () => {
    const dto: CreateTaskDto = { wbsItemId: 1, name: 'Task' };
    const res = await service.create(dto);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 1, name: 'Task' });
  });
});
