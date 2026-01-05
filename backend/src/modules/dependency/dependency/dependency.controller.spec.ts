import { Test, TestingModule } from '@nestjs/testing';
import { DependencyController } from './dependency.controller';
import { DependencyService } from './dependency.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrgGuard } from '../../../common/guards/org.guard';

describe('DependencyController', () => {
  let controller: DependencyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DependencyController],
      providers: [
        { provide: DependencyService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DependencyController>(DependencyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
