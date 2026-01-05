import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrgGuard } from '../../../common/guards/org.guard';

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
      getRepoSettingsWithAuth: jest.fn(),
      updateRepoSettingsWithAuth: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        { provide: ProjectService, useValue: service },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  it('should create a project', async () => {
    const dto: CreateProjectDto = { name: 'Test', description: 'Desc' };
    const result = { id: 1, ...dto };
    service.create.mockResolvedValue(result);
    await expect(controller.create(dto, { id: 1, username: 'u', isSuperAdmin: true } as any, { orgId: 1 } as any)).resolves.toEqual(result);
    expect(service.create).toHaveBeenCalledWith(dto, 1, 1, true);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
