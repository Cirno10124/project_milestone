import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './typeorm.config';
import { ProjectModule } from './modules/project/project.module';
import { WbsItemModule } from './modules/wbs-item/wbs-item.module';
import { TaskModule } from './modules/task/task.module';
import { DependencyModule } from './modules/dependency/dependency.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { ScoreModule } from './modules/score/score.module';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), ProjectModule, WbsItemModule, TaskModule, DependencyModule, ScheduleModule, ScoreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
