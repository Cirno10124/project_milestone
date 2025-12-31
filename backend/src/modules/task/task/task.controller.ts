import { BadRequestException, Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrgGuard } from '../../../common/guards/org.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Org as OrgDecorator } from '../../../common/decorators/org.decorator';
import type { RequestUser } from '../../../common/guards/jwt-auth.guard';
import type { OrgContext } from '../../../common/guards/org.guard';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post()
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.taskService.createWithAuth(dto, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get()
  findAll(@Query('projectId') projectId: string | undefined, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    if (!projectId) {
      if (!user.isSuperAdmin) throw new BadRequestException('缺少 projectId');
      return this.taskService.findAllForOrg(org.orgId);
    }
    return this.taskService.findByProject(+projectId, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.taskService.findOneWithAuth(+id, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.taskService.updateWithAuth(+id, dto, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.taskService.removeWithAuth(+id, user.id, org.orgId, user.isSuperAdmin);
  }

  // 任务转派：仅项目管理员
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch(':id/assignees')
  setAssignees(
    @Param('id') id: string,
    @Body() body: { assigneeUserIds: number[] },
    @CurrentUser() user: RequestUser,
    @OrgDecorator() org: OrgContext,
  ) {
    return this.taskService.setAssignees(+id, user.id, org.orgId, body.assigneeUserIds ?? [], user.isSuperAdmin);
  }
}
