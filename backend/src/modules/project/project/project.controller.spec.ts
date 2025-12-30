import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';

describe('ProjectController', () => {
  let controller: ProjectController;
  let service: Partial<Record<keyof ProjectService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [{ provide: ProjectService, useValue: service }],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  it('should create a project', async () => {
    const dto: CreateProjectDto = { name: 'Test', description: 'Desc' };
    const result = { id: 1, ...dto };
    service.create.mockResolvedValue(result);
    await expect(controller.create(dto)).resolves.toEqual(result);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
