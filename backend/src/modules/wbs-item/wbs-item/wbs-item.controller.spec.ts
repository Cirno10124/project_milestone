import { Test, TestingModule } from '@nestjs/testing';
import { WbsItemController } from './wbs-item.controller';
import { WbsItemService } from './wbs-item.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrgGuard } from '../../../common/guards/org.guard';

describe('WbsItemController', () => {
  let controller: WbsItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WbsItemController],
      providers: [
        { provide: WbsItemService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WbsItemController>(WbsItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
