import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleRun } from '../schedule-run.entity';
import { ScheduleItem } from '../schedule-item.entity';
import { CreateScheduleRunDto } from '../dto/create-schedule-run.dto';
import { UpdateScheduleRunDto } from '../dto/update-schedule-run.dto';
import { CreateScheduleItemDto } from '../dto/create-schedule-item.dto';
import { UpdateScheduleItemDto } from '../dto/update-schedule-item.dto';
import { Project } from '../../project/entities/project.entity';
import { Task } from '../../task/entities/task.entity';
import { ProjectMember } from '../../project/entities/project-member.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ScheduleRun)
    private readonly runRepo: Repository<ScheduleRun>,
    @InjectRepository(ScheduleItem)
    private readonly itemRepo: Repository<ScheduleItem>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
  ) {}

  async createRun(dto: CreateScheduleRunDto): Promise<ScheduleRun> {
    const entity = this.runRepo.create(dto);
    return this.runRepo.save(entity);
  }

  findAllRuns(): Promise<ScheduleRun[]> {
    return this.runRepo.find({ relations: ['items'] });
  }

  findAllRunsForOrg(orgId: number): Promise<ScheduleRun[]> {
    return this.runRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.items', 'i')
      .leftJoinAndSelect('r.project', 'p')
      .where('p.org_id = :orgId', { orgId })
      .orderBy('r.executed_at', 'DESC')
      .getMany();
  }

  async findRun(id: number): Promise<ScheduleRun> {
    const entity = await this.runRepo.findOne({ where: { id }, relations: ['items', 'items.task', 'project'] });
    if (!entity) throw new NotFoundException(`ScheduleRun #${id} not found`);
    return entity;
  }

  async findRunWithAuth(id: number, userId: number, orgId: number, isSuperAdmin = false): Promise<ScheduleRun> {
    const run = await this.runRepo.findOne({ where: { id }, relations: ['items', 'items.task', 'project'] });
    if (!run) throw new NotFoundException(`ScheduleRun #${id} not found`);
    await this.assertProjectMember(run.project?.id, userId, orgId, isSuperAdmin);
    return run;
  }

  async findLatestRunByProject(projectId: number): Promise<ScheduleRun> {
    const entity = await this.runRepo.findOne({
      where: { project: { id: projectId } as any },
      order: { executedAt: 'DESC' as any },
      relations: ['items', 'items.task', 'project'],
    });
    if (!entity) throw new NotFoundException(`ScheduleRun for Project #${projectId} not found`);
    return entity;
  }

  async findLatestRunByProjectWithAuth(projectId: number, userId: number, orgId: number, isSuperAdmin = false): Promise<ScheduleRun> {
    await this.assertProjectMember(projectId, userId, orgId, isSuperAdmin);
    return this.findLatestRunByProject(projectId);
  }

  async updateRun(id: number, dto: UpdateScheduleRunDto): Promise<ScheduleRun> {
    await this.runRepo.update(id, dto);
    return this.findRun(id);
  }

  async updateRunWithAuth(id: number, dto: UpdateScheduleRunDto, userId: number, orgId: number, isSuperAdmin = false): Promise<ScheduleRun> {
    const run = await this.runRepo.findOne({ where: { id }, relations: ['project'] });
    if (!run) throw new NotFoundException(`ScheduleRun #${id} not found`);
    await this.assertProjectAdmin(run.project?.id, userId, orgId, isSuperAdmin);
    return this.updateRun(id, dto);
  }

  async removeRun(id: number): Promise<void> {
    const res = await this.runRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`ScheduleRun #${id} not found`);
  }

  async removeRunWithAuth(id: number, userId: number, orgId: number, isSuperAdmin = false): Promise<{ ok: true }> {
    const run = await this.runRepo.findOne({ where: { id }, relations: ['project'] });
    if (!run) throw new NotFoundException(`ScheduleRun #${id} not found`);
    await this.assertProjectAdmin(run.project?.id, userId, orgId, isSuperAdmin);
    await this.removeRun(id);
    return { ok: true };
  }

  async createItem(dto: CreateScheduleItemDto): Promise<ScheduleItem> {
    const entity = this.itemRepo.create(dto);
    return this.itemRepo.save(entity);
  }

  findAllItems(): Promise<ScheduleItem[]> {
    return this.itemRepo.find({ relations: ['scheduleRun', 'task'] });
  }

  findAllItemsForOrg(orgId: number): Promise<ScheduleItem[]> {
    return this.itemRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.scheduleRun', 'r')
      .leftJoinAndSelect('i.task', 't')
      .leftJoin('r.project', 'p')
      .where('p.org_id = :orgId', { orgId })
      .orderBy('i.id', 'DESC')
      .getMany();
  }

  async findItem(id: number): Promise<ScheduleItem> {
    const entity = await this.itemRepo.findOne({ where: { id }, relations: ['scheduleRun', 'task'] });
    if (!entity) throw new NotFoundException(`ScheduleItem #${id} not found`);
    return entity;
  }

  async findItemWithAuth(id: number, userId: number, orgId: number, isSuperAdmin = false): Promise<ScheduleItem> {
    const item = await this.itemRepo.findOne({ where: { id }, relations: ['scheduleRun', 'scheduleRun.project', 'task'] });
    if (!item) throw new NotFoundException(`ScheduleItem #${id} not found`);
    await this.assertProjectMember(item.scheduleRun?.project?.id, userId, orgId, isSuperAdmin);
    return item;
  }

  async updateItem(id: number, dto: UpdateScheduleItemDto): Promise<ScheduleItem> {
    await this.itemRepo.update(id, dto);
    return this.findItem(id);
  }

  async updateItemWithAuth(id: number, dto: UpdateScheduleItemDto, userId: number, orgId: number, isSuperAdmin = false): Promise<ScheduleItem> {
    const item = await this.itemRepo.findOne({ where: { id }, relations: ['scheduleRun', 'scheduleRun.project'] });
    if (!item) throw new NotFoundException(`ScheduleItem #${id} not found`);
    await this.assertProjectAdmin(item.scheduleRun?.project?.id, userId, orgId, isSuperAdmin);
    return this.updateItem(id, dto);
  }

  async removeItem(id: number): Promise<void> {
    const res = await this.itemRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`ScheduleItem #${id} not found`);
  }

  async removeItemWithAuth(id: number, userId: number, orgId: number, isSuperAdmin = false): Promise<{ ok: true }> {
    const item = await this.itemRepo.findOne({ where: { id }, relations: ['scheduleRun', 'scheduleRun.project'] });
    if (!item) throw new NotFoundException(`ScheduleItem #${id} not found`);
    await this.assertProjectAdmin(item.scheduleRun?.project?.id, userId, orgId, isSuperAdmin);
    await this.removeItem(id);
    return { ok: true };
  }

  /**
   * 运行关键路径算法并保存结果
   */
  async computeScheduleWithAuth(projectId: number, runType: 'initial' | 'rolling', userId: number, orgId: number, isSuperAdmin = false): Promise<ScheduleRun> {
    await this.assertProjectAdmin(projectId, userId, orgId, isSuperAdmin);
    return this.computeSchedule(projectId, runType, orgId);
  }

  async computeSchedule(projectId: number, runType: 'initial' | 'rolling', orgId?: number): Promise<ScheduleRun> {
    const project = orgId ? await this.getProjectEnsuringOrg(projectId, orgId) : await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project #${projectId} not found`);
    const tasks = await this.taskRepo.find({ relations: ['predecessors', 'wbsItem', 'wbsItem.project'] });
    const projTasks = tasks.filter(t => t.wbsItem.project.id === projectId);
    const inDegree = new Map<number, number>();
    const nextMap = new Map<number, number[]>();
    projTasks.forEach(t => { inDegree.set(t.id, t.predecessors.length); nextMap.set(t.id, []); });
    projTasks.forEach(t => {
      t.predecessors.forEach(dep => {
        // 这里不要依赖 dep.predecessor（未必被 join），用 predecessorId 更稳
        nextMap.get(dep.predecessorId)!.push(t.id);
      });
    });
    const es = new Map<number, Date>(); const ef = new Map<number, Date>();
    const baseDate = project.startDate ? new Date(project.startDate) : new Date();
    projTasks.forEach(t => {
      es.set(t.id, new Date(baseDate));
      ef.set(t.id, new Date(baseDate.getTime() + (t.duration || 0) * 86400000));
    });
    const queue = projTasks.filter(t => inDegree.get(t.id)! === 0).map(t => t.id);
    while (queue.length) {
      const id = queue.shift()!;
      const t = projTasks.find(x => x.id === id)!;
      const tES = es.get(id)!;
      const tEF = new Date(tES.getTime() + (t.duration || 0) * 86400000);
      ef.set(id, tEF);
      nextMap.get(id)!.forEach(nid => {
        const prevES = es.get(nid)!;
        if (tEF > prevES) es.set(nid, tEF);
        inDegree.set(nid, inDegree.get(nid)! - 1);
        if (inDegree.get(nid)! === 0) queue.push(nid);
      });
    }
    const maxEF = new Date(Math.max(...Array.from(ef.values()).map(d => d.getTime())));
    const ls = new Map<number, Date>(); const lf = new Map<number, Date>();
    projTasks.forEach(t => {
      lf.set(t.id, new Date(maxEF));
      ls.set(t.id, new Date(maxEF.getTime() - (t.duration || 0) * 86400000));
    });
    projTasks.slice().reverse().forEach(t => {
      nextMap.get(t.id)!.forEach(nid => {
        const childLS = ls.get(nid)!;
        if (childLS < lf.get(t.id)!) {
          lf.set(t.id, childLS);
          ls.set(t.id, new Date(childLS.getTime() - (t.duration || 0) * 86400000));
        }
      });
    });
    const run = await this.runRepo.save({ project, runType } as any);
    for (const t of projTasks) {
      await this.itemRepo.save({
        scheduleRun: run,
        task: t,
        earlyStart: es.get(t.id), earlyFinish: ef.get(t.id),
        lateStart: ls.get(t.id), lateFinish: lf.get(t.id),
        slack: Math.round((ls.get(t.id)!.getTime() - es.get(t.id)!.getTime()) / 86400000),
      } as any);
    }
    // 返回带 items/task 的完整结果，便于前端直接使用
    return this.findRun(run.id);
  }

  private async assertProjectMember(projectId: number | undefined, userId: number, orgId: number, isSuperAdmin = false) {
    if (!projectId) throw new ForbiddenException('无项目权限');
    await this.getProjectEnsuringOrg(projectId, orgId);
    if (isSuperAdmin) return;
    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId } });
    if (!pm) throw new ForbiddenException('无项目权限');
  }

  private async assertProjectAdmin(projectId: number | undefined, userId: number, orgId: number, isSuperAdmin = false) {
    if (!projectId) throw new ForbiddenException('无项目权限');
    await this.getProjectEnsuringOrg(projectId, orgId);
    if (isSuperAdmin) return;
    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId } });
    if (!pm) throw new ForbiddenException('无项目权限');
    if (pm.role !== 'admin') throw new ForbiddenException('需要项目管理员权限');
  }

  private async getProjectEnsuringOrg(projectId: number, orgId: number): Promise<Project> {
    const p = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!p) throw new NotFoundException(`Project #${projectId} not found`);
    // MySQL BIGINT 可能在运行时表现为 string；统一做数值化比较避免误判
    if (Number((p as any).orgId) !== Number(orgId)) throw new ForbiddenException('无项目权限');
    return p;
  }
}
