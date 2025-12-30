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
    // 直接使用 DTO 填充实体属性，包括 projectId 和 parentId
    const entity: WbsItem = this.wbsRepo.create(createDto);
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

  /** 更新 WBS 排序序号 */
  async updateSeq(id: number, seq: number): Promise<WbsItem> {
    await this.wbsRepo.update(id, { seq } as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const res = await this.wbsRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`WbsItem #${id} not found`);
  }
}
