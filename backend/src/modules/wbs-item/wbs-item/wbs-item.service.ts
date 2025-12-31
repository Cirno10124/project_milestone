import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WbsItem } from '../entities/wbs-item.entity';
import { CreateWbsItemDto } from '../dto/create-wbs-item.dto';
import { UpdateWbsItemDto } from '../dto/update-wbs-item.dto';
import { Project } from '../../project/entities/project.entity';
import { ProjectMember } from '../../project/entities/project-member.entity';

@Injectable()
export class WbsItemService {
  constructor(
    @InjectRepository(WbsItem)
    private readonly wbsRepo: Repository<WbsItem>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
  ) {}

  async create(createDto: CreateWbsItemDto): Promise<WbsItem> {
    // 直接使用 DTO 填充实体属性，包括 projectId 和 parentId
    const entity: WbsItem = this.wbsRepo.create(createDto);
    return this.wbsRepo.save(entity);
  }

  findAll(): Promise<WbsItem[]> {
    return this.wbsRepo.find({ relations: ['children', 'tasks'] });
  }

  async findAllForOrg(orgId: number): Promise<WbsItem[]> {
    return this.wbsRepo
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.children', 'c')
      .leftJoinAndSelect('w.tasks', 't')
      .leftJoin('w.project', 'p')
      .where('p.org_id = :orgId', { orgId })
      .orderBy('w.id', 'DESC')
      .getMany();
  }

  async findByProject(projectId: number, userId: number, orgId: number, isSuperAdmin = false): Promise<WbsItem[]> {
    await this.assertProjectMember(projectId, userId, orgId, isSuperAdmin);
    return this.wbsRepo.find({ where: { projectId } as any, relations: ['children', 'tasks'] });
  }

  async findOne(id: number): Promise<WbsItem> {
    const item = await this.wbsRepo.findOne({ where: { id }, relations: ['children', 'tasks'] });
    if (!item) throw new NotFoundException(`WbsItem #${id} not found`);
    return item;
  }

  async findOneWithAuth(id: number, userId: number, orgId: number, isSuperAdmin = false): Promise<WbsItem> {
    const item = await this.wbsRepo.findOne({ where: { id }, relations: ['children', 'tasks', 'project'] });
    if (!item) throw new NotFoundException(`WbsItem #${id} not found`);
    await this.assertProjectMember(item.projectId, userId, orgId, isSuperAdmin);
    return item;
  }

  async createWithAuth(createDto: CreateWbsItemDto, userId: number, orgId: number, isSuperAdmin = false): Promise<WbsItem> {
    await this.assertProjectAdmin(createDto.projectId, userId, orgId, isSuperAdmin);
    if (createDto.parentId) {
      const parent = await this.wbsRepo.findOne({ where: { id: createDto.parentId } });
      if (!parent) throw new NotFoundException('父 WBS 不存在');
      if (parent.projectId !== createDto.projectId) throw new ForbiddenException('父 WBS 不属于该项目');
    }
    return this.create(createDto);
  }

  async update(id: number, updateDto: UpdateWbsItemDto): Promise<WbsItem> {
    await this.wbsRepo.update(id, updateDto);
    return this.findOne(id);
  }

  async updateWithAuth(id: number, updateDto: UpdateWbsItemDto, userId: number, orgId: number, isSuperAdmin = false): Promise<WbsItem> {
    const item = await this.wbsRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`WbsItem #${id} not found`);
    await this.assertProjectAdmin(item.projectId, userId, orgId, isSuperAdmin);
    return this.update(id, updateDto);
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

  async removeWithAuth(id: number, userId: number, orgId: number, isSuperAdmin = false): Promise<{ ok: true }> {
    const item = await this.wbsRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`WbsItem #${id} not found`);
    await this.assertProjectAdmin(item.projectId, userId, orgId, isSuperAdmin);
    await this.remove(id);
    return { ok: true };
  }

  private async assertProjectMember(projectId: number, userId: number, orgId: number, isSuperAdmin = false) {
    const p = await this.projectRepo.findOne({ where: { id: projectId, orgId } as any });
    if (!p) throw new ForbiddenException('无项目权限');
    if (isSuperAdmin) return;
    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId } });
    if (!pm) throw new ForbiddenException('无项目权限');
  }

  private async assertProjectAdmin(projectId: number, userId: number, orgId: number, isSuperAdmin = false) {
    const p = await this.projectRepo.findOne({ where: { id: projectId, orgId } as any });
    if (!p) throw new ForbiddenException('无项目权限');
    if (isSuperAdmin) return;
    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId } });
    if (!pm) throw new ForbiddenException('无项目权限');
    if (pm.role !== 'admin') throw new ForbiddenException('需要项目管理员权限');
  }
}
