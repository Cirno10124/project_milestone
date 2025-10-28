import { Module } from '@nestjs/common';
import { TaskService } from './task/task.service';
import { TaskController } from './task/task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  providers: [TaskService],
  controllers: [TaskController]
})
export class TaskModule {}
