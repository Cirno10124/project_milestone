import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

  async createRun(dto: CreateScheduleRunDto): Promise<ScheduleRun> {
    const entity = this.runRepo.create(dto);
    return this.runRepo.save(entity);
  }

  findAllRuns(): Promise<ScheduleRun[]> {
    return this.runRepo.find({ relations: ['items'] });
  }

  async findRun(id: number): Promise<ScheduleRun> {
    const entity = await this.runRepo.findOne({ where: { id }, relations: ['items'] });
    if (!entity) throw new NotFoundException(`ScheduleRun #${id} not found`);
    return entity;
  }

  async updateRun(id: number, dto: UpdateScheduleRunDto): Promise<ScheduleRun> {
    await this.runRepo.update(id, dto);
    return this.findRun(id);
  }

  async removeRun(id: number): Promise<void> {
    const res = await this.runRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`ScheduleRun #${id} not found`);
  }

  async createItem(dto: CreateScheduleItemDto): Promise<ScheduleItem> {
    const entity = this.itemRepo.create(dto);
    return this.itemRepo.save(entity);
  }

  findAllItems(): Promise<ScheduleItem[]> {
    return this.itemRepo.find({ relations: ['scheduleRun', 'task'] });
  }

  async findItem(id: number): Promise<ScheduleItem> {
    const entity = await this.itemRepo.findOne({ where: { id }, relations: ['scheduleRun', 'task'] });
    if (!entity) throw new NotFoundException(`ScheduleItem #${id} not found`);
    return entity;
  }

  async updateItem(id: number, dto: UpdateScheduleItemDto): Promise<ScheduleItem> {
    await this.itemRepo.update(id, dto);
    return this.findItem(id);
  }

  async removeItem(id: number): Promise<void> {
    const res = await this.itemRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`ScheduleItem #${id} not found`);
  }

  /**
   * 运行关键路径算法并保存结果
   */
  async computeSchedule(projectId: number, runType: 'initial' | 'rolling'): Promise<ScheduleRun> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project #${projectId} not found`);
    const tasks = await this.taskRepo.find({ relations: ['predecessors', 'wbsItem', 'wbsItem.project'] });
    const projTasks = tasks.filter(t => t.wbsItem.project.id === projectId);
    const inDegree = new Map<number, number>();
    const nextMap = new Map<number, number[]>();
    projTasks.forEach(t => { inDegree.set(t.id, t.predecessors.length); nextMap.set(t.id, []); });
    projTasks.forEach(t => {
      t.predecessors.forEach(dep => {
        nextMap.get(dep.predecessor.id)!.push(t.id);
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
    return run;
  }
}
