import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { Task } from '../../task/entities/task.entity';
import { WbsItem } from '../../wbs-item/entities/wbs-item.entity';
import * as ExcelJS from 'exceljs';
import { ProjectMember } from '../entities/project-member.entity';
import { OrgMember } from '../../org/entities/org-member.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(WbsItem)
    private readonly wbsRepo: Repository<WbsItem>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(OrgMember)
    private readonly orgMemberRepo: Repository<OrgMember>,
  ) {}

  async create(createDto: CreateProjectDto, userId: number, orgId: number, isSuperAdmin = false): Promise<Project> {
    // 必须属于 org
    if (!isSuperAdmin) {
      const orgMember = await this.orgMemberRepo.findOne({ where: { orgId, userId } });
      if (!orgMember) throw new ForbiddenException('不属于该组织');
    }

    const proj = this.projectRepo.create({ ...createDto, orgId });
    const saved = await this.projectRepo.save(proj);
    await this.projectMemberRepo.save(this.projectMemberRepo.create({ projectId: saved.id, userId, role: 'admin' }));
    return saved;
  }

  async findAll(userId: number, orgId: number, isSuperAdmin = false): Promise<Array<Project & { role: 'admin' | 'member' }>> {
    if (isSuperAdmin) {
      const ps = await this.projectRepo.find({ where: { orgId }, order: { id: 'DESC' } as any });
      return ps.map((p) => Object.assign(p, { role: 'admin' as const }));
    }
    const rows = await this.projectMemberRepo
      .createQueryBuilder('pm')
      .innerJoinAndSelect('pm.project', 'p')
      .where('pm.user_id = :userId', { userId })
      .andWhere('p.org_id = :orgId', { orgId })
      .orderBy('p.id', 'DESC')
      .getMany();
    return rows.map((r) => Object.assign(r.project, { role: r.role }));
  }

  async findOne(id: number, userId: number, orgId: number, isSuperAdmin = false): Promise<Project & { role: 'admin' | 'member' }> {
    if (isSuperAdmin) {
      const proj = await this.projectRepo.findOne({ where: { id, orgId }, relations: ['wbsItems'] });
      if (!proj) throw new NotFoundException(`Project #${id} not found`);
      return Object.assign(proj, { role: 'admin' as const });
    }
    const role = await this.getMyProjectRole(id, userId, orgId, isSuperAdmin);
    const proj = await this.projectRepo.findOne({ where: { id, orgId }, relations: ['wbsItems'] });
    if (!proj) throw new NotFoundException(`Project #${id} not found`);
    return Object.assign(proj, { role });
  }

  async update(id: number, updateDto: UpdateProjectDto, userId: number, orgId: number, isSuperAdmin = false): Promise<Project & { role: 'admin' | 'member' }> {
    const role = await this.getMyProjectRole(id, userId, orgId, isSuperAdmin);
    if (role !== 'admin') throw new ForbiddenException('需要项目管理员权限');
    await this.projectRepo.update({ id, orgId }, updateDto);
    return this.findOne(id, userId, orgId, isSuperAdmin);
  }

  async remove(id: number, userId: number, orgId: number, isSuperAdmin = false): Promise<void> {
    const role = await this.getMyProjectRole(id, userId, orgId, isSuperAdmin);
    if (role !== 'admin') throw new ForbiddenException('需要项目管理员权限');
    const res = await this.projectRepo.delete({ id, orgId });
    if (res.affected === 0) throw new NotFoundException(`Project #${id} not found`);
  }

  async getMyProjectRole(projectId: number, userId: number, orgId: number, isSuperAdmin = false) {
    if (isSuperAdmin) {
      const p = await this.projectRepo.findOne({ where: { id: projectId, orgId } });
      if (!p) throw new ForbiddenException('无项目权限');
      return 'admin' as const;
    }
    const p = await this.projectRepo.findOne({ where: { id: projectId, orgId } });
    if (!p) throw new ForbiddenException('无项目权限');
    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId } });
    if (!pm) throw new ForbiddenException('无项目权限');
    return pm.role;
  }

  async listMembers(projectId: number, userId: number, orgId: number, isSuperAdmin = false) {
    await this.getMyProjectRole(projectId, userId, orgId, isSuperAdmin);
    const rows = await this.projectMemberRepo.find({ where: { projectId }, relations: ['user'] });
    return rows.map((r) => ({ id: r.userId, username: r.user?.username ?? '', role: r.role }));
  }

  async addMember(projectId: number, actorUserId: number, orgId: number, dto: { userId: number; role: 'admin' | 'member' }, isSuperAdmin = false) {
    const role = await this.getMyProjectRole(projectId, actorUserId, orgId, isSuperAdmin);
    if (role !== 'admin') throw new ForbiddenException('需要项目管理员权限');
    // 目标用户必须属于组织
    const m = await this.orgMemberRepo.findOne({ where: { orgId, userId: dto.userId } });
    if (!m) throw new ForbiddenException('目标用户不属于该组织');

    const exists = await this.projectMemberRepo.findOne({ where: { projectId, userId: dto.userId } });
    if (exists) {
      exists.role = dto.role;
      await this.projectMemberRepo.save(exists);
      return { ok: true };
    }
    await this.projectMemberRepo.save(this.projectMemberRepo.create({ projectId, userId: dto.userId, role: dto.role }));
    return { ok: true };
  }

  async changeMemberRole(projectId: number, actorUserId: number, orgId: number, targetUserId: number, role: 'admin' | 'member') {
    const myRole = await this.getMyProjectRole(projectId, actorUserId, orgId);
    if (myRole !== 'admin') throw new ForbiddenException('需要项目管理员权限');
    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId: targetUserId } });
    if (!pm) throw new NotFoundException('成员不存在');
    pm.role = role;
    await this.projectMemberRepo.save(pm);
    return { ok: true };
  }

  async removeMember(projectId: number, actorUserId: number, orgId: number, targetUserId: number) {
    const myRole = await this.getMyProjectRole(projectId, actorUserId, orgId);
    if (myRole !== 'admin') throw new ForbiddenException('需要项目管理员权限');
    await this.projectMemberRepo.delete({ projectId, userId: targetUserId });
    return { ok: true };
  }

  /**
   * 获取甘特图数据（用于预览）
   */
  async getGanttData(projectId: number, userId: number, orgId: number, isSuperAdmin = false) {
    await this.getMyProjectRole(projectId, userId, orgId, isSuperAdmin);
    const project = await this.projectRepo.findOne({ where: { id: projectId, orgId } });
    if (!project) throw new NotFoundException(`Project #${projectId} not found`);

    const tasks = await this.taskRepo.find({
      relations: ['wbsItem'],
      where: {
        wbsItem: { project: { id: projectId } },
      },
    });

    return tasks.map(task => ({
      id: task.id,
      taskName: task.name,
      wbsName: task.wbsItem?.name || '-',
      startDate: task.startDate || '-',
      endDate: task.endDate || '-',
      duration: task.duration || 0,
      percentComplete: task.percentComplete || 0,
      status: task.status || 'not_started',
    }));
  }

  /**
   * 导出甘特图为Excel文件
   */
  async exportGantt(projectId: number, userId: number, orgId: number, isSuperAdmin = false): Promise<Buffer> {
    await this.getMyProjectRole(projectId, userId, orgId, isSuperAdmin);
    const project = await this.projectRepo.findOne({ where: { id: projectId, orgId } });
    if (!project) throw new NotFoundException(`Project #${projectId} not found`);

    const tasks = await this.taskRepo.find({
      relations: ['wbsItem'],
      where: {
        wbsItem: { project: { id: projectId } },
      },
    });
    
    // 按 WBS seq 排序
    tasks.sort((a, b) => {
      const seqA = a.wbsItem?.seq ?? 0;
      const seqB = b.wbsItem?.seq ?? 0;
      return seqA - seqB;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('甘特图');

    // 设置列标题
    worksheet.columns = [
      { header: '任务ID', key: 'id', width: 10 },
      { header: '任务名称', key: 'taskName', width: 30 },
      { header: 'WBS节点', key: 'wbsName', width: 20 },
      { header: '开始时间', key: 'startDate', width: 15 },
      { header: '结束时间', key: 'endDate', width: 15 },
      { header: '持续时间（天）', key: 'duration', width: 15 },
      { header: '完成度（%）', key: 'percentComplete', width: 15 },
      { header: '状态', key: 'status', width: 15 },
    ];

    // 设置标题行样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // 添加数据行
    tasks.forEach(task => {
      worksheet.addRow({
        id: task.id,
        taskName: task.name,
        wbsName: task.wbsItem?.name || '-',
        startDate: task.startDate || '-',
        endDate: task.endDate || '-',
        duration: task.duration || 0,
        percentComplete: task.percentComplete || 0,
        status: task.status || 'not_started',
      });
    });

    // 生成Excel文件Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
