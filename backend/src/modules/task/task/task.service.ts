import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskAssignee } from '../entities/task-assignee.entity';
import { ProjectMember } from '../../project/entities/project-member.entity';
import { WbsItem } from '../../wbs-item/entities/wbs-item.entity';
import { Project } from '../../project/entities/project.entity';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskAssignee)
    private readonly assigneeRepo: Repository<TaskAssignee>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(WbsItem)
    private readonly wbsRepo: Repository<WbsItem>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly notificationService: NotificationService,
  ) {}

  private isCompleted(task: Task | null | undefined) {
    if (!task) return false;
    const pct = Number(task.percentComplete ?? 0);
    return task.status === 'completed' || (Number.isFinite(pct) && pct >= 100);
  }

  async create(createDto: CreateTaskDto): Promise<Task> {
    // 手动设置字段以持久化 wbs_item_id
    const entity = this.taskRepo.create();
    entity.name = createDto.name;
    entity.startDate = createDto.startDate;
    entity.endDate = createDto.endDate;
    entity.duration = createDto.duration;
    entity.status = createDto.status;
    entity.percentComplete = createDto.percentComplete;
    entity.wbsItemId = createDto.wbsItemId;
    return this.taskRepo.save(entity);
  }

  async createWithAuth(createDto: CreateTaskDto, userId: number, orgId: number, isSuperAdmin = false) {
    const projectId = await this.getProjectIdByWbsItem(createDto.wbsItemId);
    await this.assertProjectAdmin(projectId, userId, orgId, isSuperAdmin);
    return this.create(createDto);
  }

  findAll(): Promise<Task[]> {
    return this.taskRepo.find({ relations: ['wbsItem'] });
  }

  /**
   * 超级管理员专用：按组织维度列出所有任务（仍受 X-Org-Id 限制）
   */
  async findAllForOrg(orgId: number): Promise<Task[]> {
    return this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.wbsItem', 'w')
      .leftJoin('w.project', 'p')
      .where('p.org_id = :orgId', { orgId })
      .orderBy('t.id', 'DESC')
      .getMany();
  }
  /** 根据项目ID获取任务 */
  async findByProject(projectId: number, userId: number, orgId: number, isSuperAdmin = false): Promise<Task[]> {
    await this.assertProjectMember(projectId, userId, orgId, isSuperAdmin);
    return this.taskRepo.find({
      relations: [
        'wbsItem',
        'predecessors',
        'predecessors.predecessor',
        'successors',
        'successors.task',
        'assignees',
        'assignees.user',
      ],
      where: { wbsItem: { project: { id: projectId } } },
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id }, relations: ['wbsItem', 'predecessors', 'successors'] });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  async findOneWithAuth(id: number, userId: number, orgId: number, isSuperAdmin = false): Promise<Task> {
    const projectId = await this.getProjectIdByTask(id);
    await this.assertProjectMember(projectId, userId, orgId, isSuperAdmin);
    return this.findOne(id);
  }

  async update(id: number, updateDto: UpdateTaskDto): Promise<Task> {
    await this.taskRepo.update(id, updateDto);
    return this.findOne(id);
  }

  async updateWithAuth(id: number, updateDto: UpdateTaskDto, userId: number, orgId: number, isSuperAdmin = false): Promise<Task> {
    const projectId = await this.getProjectIdByTask(id);
    await this.assertProjectAdmin(projectId, userId, orgId, isSuperAdmin);
    const before = await this.findOne(id);
    const after = await this.update(id, updateDto);
    if (!this.isCompleted(before) && this.isCompleted(after)) {
      await this.notificationService.notifyTaskCompleted({ projectId, taskId: after.id });
      await this.maybeHandleMilestoneCompleted(after.wbsItemId, projectId);
    }
    return after;
  }

  /**
   * Webhook 专用：仅允许更新属于指定项目的任务（不依赖用户身份）
   */
  async updateFromWebhook(projectId: number, taskId: number, updateDto: UpdateTaskDto): Promise<Task> {
    const realProjectId = await this.getProjectIdByTask(taskId);
    if (realProjectId !== projectId) throw new ForbiddenException('任务不属于该项目');
    const before = await this.findOne(taskId);
    const after = await this.update(taskId, updateDto);
    if (!this.isCompleted(before) && this.isCompleted(after)) {
      await this.notificationService.notifyTaskCompleted({ projectId, taskId: after.id });
      await this.maybeHandleMilestoneCompleted(after.wbsItemId, projectId);
    }
    return after;
  }

  private async maybeHandleMilestoneCompleted(wbsItemId: number, projectId: number) {
    const wbs = await this.wbsRepo.findOne({ where: { id: wbsItemId } });
    if (!wbs) return;
    if (wbs.completedAt) return; // 已经完成过（用于去重）

    const tasks = await this.taskRepo.find({ where: { wbsItemId } as any });
    if (!tasks || tasks.length === 0) return;
    const allDone = tasks.every((t) => this.isCompleted(t));
    if (!allDone) return;

    await this.wbsRepo.update({ id: wbsItemId } as any, { completedAt: new Date() } as any);
    await this.notificationService.notifyMilestoneCompleted({ projectId, wbsItemId });
  }

  async remove(id: number): Promise<void> {
    const res = await this.taskRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`Task #${id} not found`);
  }

  async removeWithAuth(id: number, userId: number, orgId: number, isSuperAdmin = false): Promise<{ ok: true }> {
    const projectId = await this.getProjectIdByTask(id);
    await this.assertProjectAdmin(projectId, userId, orgId, isSuperAdmin);
    await this.remove(id);
    return { ok: true };
  }

  private async getProjectIdByTask(taskId: number): Promise<number> {
    const task = await this.taskRepo.findOne({ where: { id: taskId }, relations: ['wbsItem', 'wbsItem.project'] });
    if (!task?.wbsItem?.project?.id) throw new NotFoundException('任务不存在');
    return task.wbsItem.project.id;
  }

  private async getProjectIdByWbsItem(wbsItemId: number): Promise<number> {
    const wbs = await this.wbsRepo.findOne({ where: { id: wbsItemId }, relations: ['project'] });
    if (!wbs?.project?.id) throw new NotFoundException('WBS 不存在');
    return wbs.project.id;
  }

  async assertProjectMember(projectId: number, userId: number, orgId: number, isSuperAdmin = false) {
    // 统一：先确认项目属于 org，再按需校验成员/角色
    const p = await this.projectRepo.findOne({ where: { id: projectId, orgId } as any });
    if (!p) throw new ForbiddenException('无项目权限');
    if (isSuperAdmin) return;
    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId } });
    if (!pm) throw new ForbiddenException('无项目权限');
  }

  async assertProjectAdmin(projectId: number, userId: number, orgId: number, isSuperAdmin = false) {
    const p = await this.projectRepo.findOne({ where: { id: projectId, orgId } as any });
    if (!p) throw new ForbiddenException('无项目权限');
    if (isSuperAdmin) return;
    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId } });
    if (!pm) throw new ForbiddenException('无项目权限');
    if (pm.role !== 'admin') throw new ForbiddenException('需要项目管理员权限');
  }

  async setAssignees(taskId: number, userId: number, orgId: number, assigneeUserIds: number[], isSuperAdmin = false) {
    const projectId = await this.getProjectIdByTask(taskId);
    await this.assertProjectAdmin(projectId, userId, orgId, isSuperAdmin);

    // 覆盖式更新
    await this.assigneeRepo.delete({ taskId });
    const uniq = [...new Set((assigneeUserIds ?? []).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0))];
    if (uniq.length === 0) return { ok: true };

    const rows = uniq.map((aid) =>
      this.assigneeRepo.create({
        taskId,
        userId: aid,
        assignedBy: userId,
      }),
    );
    await this.assigneeRepo.save(rows);
    return { ok: true };
  }
}
