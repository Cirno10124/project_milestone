import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async create(createDto: CreateProjectDto): Promise<Project> {
    const proj = this.projectRepo.create(createDto);
    return await this.projectRepo.save(proj);
  }

  findAll(): Promise<Project[]> {
    return this.projectRepo.find({ relations: ['wbsItems'] });
  }

  async findOne(id: number): Promise<Project> {
    const proj = await this.projectRepo.findOne({ where: { id }, relations: ['wbsItems'] });
    if (!proj) throw new NotFoundException(`Project #${id} not found`);
    return proj;
  }

  async update(id: number, updateDto: UpdateProjectDto): Promise<Project> {
    await this.projectRepo.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const res = await this.projectRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`Project #${id} not found`);
  }
}
