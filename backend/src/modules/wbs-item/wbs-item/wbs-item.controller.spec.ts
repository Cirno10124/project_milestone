import { Test, TestingModule } from '@nestjs/testing';
import { WbsItemController } from './wbs-item.controller';
import { WbsItemService } from './wbs-item.service';

describe('WbsItemController', () => {
  let controller: WbsItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WbsItemController],
      providers: [{ provide: WbsItemService, useValue: {} }],
    }).compile();

    controller = module.get<WbsItemController>(WbsItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
