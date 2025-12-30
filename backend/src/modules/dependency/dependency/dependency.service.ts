import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dependency } from '../dependency.entity';
import { CreateDependencyDto } from '../dto/create-dependency.dto';
import { UpdateDependencyDto } from '../dto/update-dependency.dto';

@Injectable()
export class DependencyService {
  constructor(
    @InjectRepository(Dependency)
    private readonly depRepo: Repository<Dependency>,
  ) {}

  async create(dto: CreateDependencyDto): Promise<Dependency> {
    const entity = this.depRepo.create(dto);
    return this.depRepo.save(entity);
  }

  findAll(): Promise<Dependency[]> {
    return this.depRepo.find({ relations: ['task', 'predecessor'] });
  }

  async findOne(id: number): Promise<Dependency> {
    const entity = await this.depRepo.findOne({ where: { id }, relations: ['task', 'predecessor'] });
    if (!entity) throw new NotFoundException(`Dependency #${id} not found`);
    return entity;
  }

  async update(id: number, dto: UpdateDependencyDto): Promise<Dependency> {
    await this.depRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const res = await this.depRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`Dependency #${id} not found`);
  }
}
