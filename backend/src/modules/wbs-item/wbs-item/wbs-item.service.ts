import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WbsItem } from '../entities/wbs-item.entity';
import { CreateWbsItemDto } from '../dto/create-wbs-item.dto';
import { UpdateWbsItemDto } from '../dto/update-wbs-item.dto';

@Injectable()
export class WbsItemService {
  constructor(
    @InjectRepository(WbsItem)
    private readonly wbsRepo: Repository<WbsItem>,
  ) {}

  async create(createDto: CreateWbsItemDto): Promise<WbsItem> {
    const entity = this.wbsRepo.create();
    entity.name = createDto.name;
    entity.description = createDto.description;
    entity.duration = createDto.duration;
    entity.projectId = createDto.projectId;
    if (createDto.parentId !== undefined) {
      entity.parentId = createDto.parentId;
    }
    return this.wbsRepo.save(entity);
  }

  findAll(): Promise<WbsItem[]> {
    return this.wbsRepo.find({ relations: ['children', 'tasks'] });
  }

  async findOne(id: number): Promise<WbsItem> {
    const item = await this.wbsRepo.findOne({ where: { id }, relations: ['children', 'tasks'] });
    if (!item) throw new NotFoundException(`WbsItem #${id} not found`);
    return item;
  }

  async update(id: number, updateDto: UpdateWbsItemDto): Promise<WbsItem> {
    await this.wbsRepo.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const res = await this.wbsRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`WbsItem #${id} not found`);
  }
}
