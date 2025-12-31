import { Module } from '@nestjs/common';
import { WbsItemService } from './wbs-item/wbs-item.service';
import { WbsItemController } from './wbs-item/wbs-item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WbsItem } from './entities/wbs-item.entity';
import { Project } from '../project/entities/project.entity';
import { ProjectMember } from '../project/entities/project-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WbsItem, Project, ProjectMember])],
  providers: [WbsItemService],
  controllers: [WbsItemController]
})
export class WbsItemModule {}
