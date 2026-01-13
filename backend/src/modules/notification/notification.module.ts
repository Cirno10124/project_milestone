import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { CiController } from './ci.controller';
import { Project } from '../project/entities/project.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { UserAccount } from '../auth/entities/user.entity';
import { Task } from '../task/entities/task.entity';
import { WbsItem } from '../wbs-item/entities/wbs-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMember, UserAccount, Task, WbsItem])],
  providers: [NotificationService],
  controllers: [CiController],
  exports: [NotificationService],
})
export class NotificationModule {}

