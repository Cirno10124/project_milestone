import { BadRequestException, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleRunDto } from '../dto/create-schedule-run.dto';
import { UpdateScheduleRunDto } from '../dto/update-schedule-run.dto';
import { CreateScheduleItemDto } from '../dto/create-schedule-item.dto';
import { UpdateScheduleItemDto } from '../dto/update-schedule-item.dto';
import { ComputeScheduleDto } from '../dto/compute-schedule.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrgGuard } from '../../../common/guards/org.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Org as OrgDecorator } from '../../../common/decorators/org.decorator';
import type { RequestUser } from '../../../common/guards/jwt-auth.guard';
import type { OrgContext } from '../../../common/guards/org.guard';

@Controller('schedule-runs')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /**
   * 运行关键路径（CPM）计算，并返回包含 items/task 的结果
   */
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post('compute')
  compute(@Body() dto: ComputeScheduleDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.scheduleService.computeScheduleWithAuth(dto.projectId, dto.runType ?? 'initial', user.id, org.orgId, user.isSuperAdmin);
  }

  /**
   * 获取某项目最近一次关键路径运行结果
   */
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get('latest')
  latest(@CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext, @Query('projectId') projectId?: string) {
    if (!projectId) throw new BadRequestException('缺少 projectId');
    return this.scheduleService.findLatestRunByProjectWithAuth(Number(projectId), user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post()
  createRun(@Body() dto: CreateScheduleRunDto, @CurrentUser() user: RequestUser) {
    if (!user.isSuperAdmin) throw new ForbiddenException('仅超级管理员可用');
    return this.scheduleService.createRun(dto);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get()
  findAllRuns(@CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    if (!user.isSuperAdmin) throw new ForbiddenException('仅超级管理员可用');
    return this.scheduleService.findAllRunsForOrg(org.orgId);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post('items')
  createItem(@Body() dto: CreateScheduleItemDto, @CurrentUser() user: RequestUser) {
    if (!user.isSuperAdmin) throw new ForbiddenException('仅超级管理员可用');
    return this.scheduleService.createItem(dto);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get('items')
  findAllItems(@CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    if (!user.isSuperAdmin) throw new ForbiddenException('仅超级管理员可用');
    return this.scheduleService.findAllItemsForOrg(org.orgId);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get('items/:id')
  findItem(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) throw new BadRequestException('非法 id');
    return this.scheduleService.findItemWithAuth(n, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateScheduleItemDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) throw new BadRequestException('非法 id');
    return this.scheduleService.updateItemWithAuth(n, dto, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Delete('items/:id')
  removeItem(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) throw new BadRequestException('非法 id');
    return this.scheduleService.removeItemWithAuth(n, user.id, org.orgId, user.isSuperAdmin);
  }

  // NOTE: keep these ":id" routes AFTER all fixed segments like "items/*"
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get(':id')
  findRun(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) throw new BadRequestException('非法 id');
    return this.scheduleService.findRunWithAuth(n, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch(':id')
  updateRun(@Param('id') id: string, @Body() dto: UpdateScheduleRunDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) throw new BadRequestException('非法 id');
    return this.scheduleService.updateRunWithAuth(n, dto, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Delete(':id')
  removeRun(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) throw new BadRequestException('非法 id');
    return this.scheduleService.removeRunWithAuth(n, user.id, org.orgId, user.isSuperAdmin);
  }
}
