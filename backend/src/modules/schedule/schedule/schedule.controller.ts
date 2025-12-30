import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleRunDto } from '../dto/create-schedule-run.dto';
import { UpdateScheduleRunDto } from '../dto/update-schedule-run.dto';
import { CreateScheduleItemDto } from '../dto/create-schedule-item.dto';
import { UpdateScheduleItemDto } from '../dto/update-schedule-item.dto';
import { ComputeScheduleDto } from '../dto/compute-schedule.dto';

@Controller('schedule-runs')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /**
   * 运行关键路径（CPM）计算，并返回包含 items/task 的结果
   */
  @Post('compute')
  compute(@Body() dto: ComputeScheduleDto) {
    return this.scheduleService.computeSchedule(dto.projectId, dto.runType ?? 'initial');
  }

  /**
   * 获取某项目最近一次关键路径运行结果
   */
  @Get('latest')
  latest(@Query('projectId') projectId?: string) {
    return this.scheduleService.findLatestRunByProject(Number(projectId));
  }

  @Post()
  createRun(@Body() dto: CreateScheduleRunDto) {
    return this.scheduleService.createRun(dto);
  }

  @Get()
  findAllRuns() {
    return this.scheduleService.findAllRuns();
  }

  @Get(':id')
  findRun(@Param('id') id: string) {
    return this.scheduleService.findRun(+id);
  }

  @Patch(':id')
  updateRun(@Param('id') id: string, @Body() dto: UpdateScheduleRunDto) {
    return this.scheduleService.updateRun(+id, dto);
  }

  @Delete(':id')
  removeRun(@Param('id') id: string) {
    return this.scheduleService.removeRun(+id);
  }

  @Post('items')
  createItem(@Body() dto: CreateScheduleItemDto) {
    return this.scheduleService.createItem(dto);
  }

  @Get('items')
  findAllItems() {
    return this.scheduleService.findAllItems();
  }

  @Get('items/:id')
  findItem(@Param('id') id: string) {
    return this.scheduleService.findItem(+id);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateScheduleItemDto) {
    return this.scheduleService.updateItem(+id, dto);
  }

  @Delete('items/:id')
  removeItem(@Param('id') id: string) {
    return this.scheduleService.removeItem(+id);
  }
}
