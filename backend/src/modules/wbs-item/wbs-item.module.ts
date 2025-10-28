import { Module } from '@nestjs/common';
import { WbsItemService } from './wbs-item/wbs-item.service';
import { WbsItemController } from './wbs-item/wbs-item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WbsItem } from './entities/wbs-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WbsItem])],
  providers: [WbsItemService],
  controllers: [WbsItemController]
})
export class WbsItemModule {}
