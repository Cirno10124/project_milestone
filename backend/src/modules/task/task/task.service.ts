import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async create(createDto: CreateTaskDto): Promise<Task> {
    const entity = this.taskRepo.create(createDto);
    return this.taskRepo.save(entity);
  }

  findAll(): Promise<Task[]> {
    return this.taskRepo.find({ relations: ['wbsItem', 'predecessors', 'successors'] });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id }, relations: ['wbsItem', 'predecessors', 'successors'] });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  async update(id: number, updateDto: UpdateTaskDto): Promise<Task> {
    await this.taskRepo.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const res = await this.taskRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`Task #${id} not found`);
  }
}
