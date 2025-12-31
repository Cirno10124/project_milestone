import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dependency } from '../dependency.entity';
import { CreateDependencyDto } from '../dto/create-dependency.dto';
import { UpdateDependencyDto } from '../dto/update-dependency.dto';
import { Task } from '../../task/entities/task.entity';
import { Project } from '../../project/entities/project.entity';
import { ProjectMember } from '../../project/entities/project-member.entity';

@Injectable()
export class DependencyService {
  constructor(
    @InjectRepository(Dependency)
    private readonly depRepo: Repository<Dependency>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
  ) {}

  async create(dto: CreateDependencyDto): Promise<Dependency> {
    const entity = this.depRepo.create(dto);
    return this.depRepo.save(entity);
  }

  findAll(): Promise<Dependency[]> {
    return this.depRepo.find({ relations: ['task', 'predecessor'] });
  }

  async findAllForOrg(orgId: number): Promise<Dependency[]> {
    return this.depRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.task', 't')
      .leftJoinAndSelect('d.predecessor', 'pre')
      .leftJoin('t.wbsItem', 'w')
      .leftJoin('w.project', 'p')
      .where('p.org_id = :orgId', { orgId })
      .orderBy('d.id', 'DESC')
      .getMany();
  }

  async findByProject(projectId: number, userId: number, orgId: number, isSuperAdmin = false): Promise<Dependency[]> {
    await this.assertProjectMember(projectId, userId, orgId, isSuperAdmin);
    return this.depRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.task', 't')
      .leftJoinAndSelect('d.predecessor', 'pre')
      .leftJoin('t.wbsItem', 'w')
      .leftJoin('w.project', 'p')
      .where('p.id = :projectId', { projectId })
      .orderBy('d.id', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<Dependency> {
    const entity = await this.depRepo.findOne({ where: { id }, relations: ['task', 'predecessor'] });
    if (!entity) throw new NotFoundException(`Dependency #${id} not found`);
    return entity;
  }

  async findOneWithAuth(id: number, userId: number, orgId: number, isSuperAdmin = false): Promise<Dependency> {
    const { projectId } = await this.getProjectIdByDependency(id);
    await this.assertProjectMember(projectId, userId, orgId, isSuperAdmin);
    return this.depRepo.findOne({
      where: { id },
      relations: ['task', 'task.wbsItem', 'predecessor', 'predecessor.wbsItem'],
    }).then((x) => {
      if (!x) throw new NotFoundException(`Dependency #${id} not found`);
      return x;
    });
  }

  async update(id: number, dto: UpdateDependencyDto): Promise<Dependency> {
    await this.depRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const res = await this.depRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`Dependency #${id} not found`);
  }

  async createWithAuth(dto: CreateDependencyDto, userId: number, orgId: number, isSuperAdmin = false): Promise<Dependency> {
    const projectId = await this.getProjectIdByTwoTasks(dto.taskId, dto.predecessorId);
    await this.assertProjectAdmin(projectId, userId, orgId, isSuperAdmin);
    return this.create(dto);
  }

  async updateWithAuth(id: number, dto: UpdateDependencyDto, userId: number, orgId: number, isSuperAdmin = false): Promise<Dependency> {
    const { projectId } = await this.getProjectIdByDependency(id);
    await this.assertProjectAdmin(projectId, userId, orgId, isSuperAdmin);
    return this.update(id, dto);
  }

  async removeWithAuth(id: number, userId: number, orgId: number, isSuperAdmin = false): Promise<{ ok: true }> {
    const { projectId } = await this.getProjectIdByDependency(id);
    await this.assertProjectAdmin(projectId, userId, orgId, isSuperAdmin);
    await this.remove(id);
    return { ok: true };
  }

  private async getProjectIdByTwoTasks(taskId: number, predecessorId: number): Promise<number> {
    const [t1, t2] = await Promise.all([
      this.taskRepo.findOne({ where: { id: taskId }, relations: ['wbsItem', 'wbsItem.project'] }),
      this.taskRepo.findOne({ where: { id: predecessorId }, relations: ['wbsItem', 'wbsItem.project'] }),
    ]);
    if (!t1?.wbsItem?.project?.id) throw new NotFoundException('taskId 对应任务不存在');
    if (!t2?.wbsItem?.project?.id) throw new NotFoundException('predecessorId 对应任务不存在');
    if (t1.wbsItem.project.id !== t2.wbsItem.project.id) throw new ForbiddenException('依赖两端任务不属于同一项目');
    return t1.wbsItem.project.id;
  }

  private async getProjectIdByDependency(depId: number): Promise<{ projectId: number }> {
    const dep = await this.depRepo.findOne({
      where: { id: depId },
      relations: ['task', 'task.wbsItem', 'task.wbsItem.project', 'predecessor', 'predecessor.wbsItem', 'predecessor.wbsItem.project'],
    });
    if (!dep) throw new NotFoundException(`Dependency #${depId} not found`);
    const p1 = dep.task?.wbsItem?.project?.id;
    const p2 = dep.predecessor?.wbsItem?.project?.id;
    if (!p1 || !p2) throw new NotFoundException('依赖关联任务不存在');
    if (p1 !== p2) throw new ForbiddenException('依赖两端任务不属于同一项目');
    return { projectId: p1 };
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
