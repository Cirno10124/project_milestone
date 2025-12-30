import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../project/entities/project.entity';
import { Task } from '../../task/entities/task.entity';
import { ScheduleRun } from '../schedule-run.entity';
import { ScheduleItem } from '../schedule-item.entity';
import { CreateScheduleRunDto } from '../dto/create-schedule-run.dto';
import { UpdateScheduleRunDto } from '../dto/update-schedule-run.dto';
import { CreateScheduleItemDto } from '../dto/create-schedule-item.dto';
import { UpdateScheduleItemDto } from '../dto/update-schedule-item.dto';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let mockProjectRepo: Partial<Repository<Project>>;
  let mockTaskRepo: Partial<Repository<Task>>;
  let mockRunRepo: Partial<Repository<ScheduleRun>>;
  let mockItemRepo: Partial<Repository<ScheduleItem>>;

  beforeEach(async () => {
    mockProjectRepo = { findOne: jest.fn().mockResolvedValue({ id: 1, startDate: '2025-10-01' }) };
    mockTaskRepo = { find: jest.fn().mockResolvedValue([
      { id: 1, duration: 3, predecessors: [], wbsItem: { project: { id: 1 } } },
      { id: 2, duration: 2, predecessors: [{ predecessor: { id: 1 } }], wbsItem: { project: { id: 1 } } }
    ]) };
    mockRunRepo = { create: jest.fn().mockImplementation(dto => dto), save: jest.fn().mockResolvedValue({ id: 100 }) };
    mockItemRepo = { save: jest.fn().mockResolvedValue(null) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: getRepositoryToken(Project), useValue: mockProjectRepo },
        { provide: getRepositoryToken(Task), useValue: mockTaskRepo },
        { provide: getRepositoryToken(ScheduleRun), useValue: mockRunRepo },
        { provide: getRepositoryToken(ScheduleItem), useValue: mockItemRepo },
      ],
    }).compile();
    service = module.get<ScheduleService>(ScheduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('computeSchedule should return saved run', async () => {
    const result = await service.computeSchedule(1, 'initial');
    expect(mockProjectRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockTaskRepo.find).toHaveBeenCalled();
    expect(mockRunRepo.save).toHaveBeenCalled();
    expect(result).toEqual({ id: 100 });
  });
});
