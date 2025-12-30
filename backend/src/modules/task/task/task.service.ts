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
  ) {}

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

  async update(id: number, updateDto: UpdateTaskDto): Promise<Task> {
    await this.taskRepo.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const res = await this.taskRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`Task #${id} not found`);
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
    // 超级管理员：只需确保项目存在且属于 org
    //（orgId 已由 OrgGuard 设置；super admin 可不加入 org/project）
    if (isSuperAdmin) {
      const p = await this.projectRepo.findOne({ where: { id: projectId, orgId } as any });
      if (!p) throw new ForbiddenException('无项目权限');
      return;
    }
    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId }, relations: ['project'] });
    if (!pm || pm.project?.orgId !== orgId) throw new ForbiddenException('无项目权限');
  }

  async assertProjectAdmin(projectId: number, userId: number, orgId: number, isSuperAdmin = false) {
    if (isSuperAdmin) {
      const p = await this.projectRepo.findOne({ where: { id: projectId, orgId } as any });
      if (!p) throw new ForbiddenException('无项目权限');
      return;
    }
    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId }, relations: ['project'] });
    if (!pm || pm.project?.orgId !== orgId) throw new ForbiddenException('无项目权限');
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
