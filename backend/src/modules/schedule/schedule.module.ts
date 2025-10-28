import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule/schedule.service';
import { ScheduleController } from './schedule/schedule.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleRun } from './schedule-run.entity';
import { ScheduleItem } from './schedule-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleRun, ScheduleItem])],
  providers: [ScheduleService],
  controllers: [ScheduleController]
})
export class ScheduleModule {}
