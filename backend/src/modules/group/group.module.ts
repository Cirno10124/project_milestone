import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { OrgMember } from '../org/entities/org-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, OrgMember])],
  providers: [GroupService],
  controllers: [GroupController],
})
export class GroupModule {}


