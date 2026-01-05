import { Controller, Get, Post, Body, Param, Patch, Delete, Res, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { UpdateProjectRepoDto } from '../dto/update-project-repo.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrgGuard } from '../../../common/guards/org.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Org as OrgDecorator } from '../../../common/decorators/org.decorator';
import type { RequestUser } from '../../../common/guards/jwt-auth.guard';
import type { OrgContext } from '../../../common/guards/org.guard';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post()
  create(@Body() createDto: CreateProjectDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.projectService.create(createDto, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get()
  findAll(@CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.projectService.findAll(user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.projectService.findOne(+id, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateProjectDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.projectService.update(+id, updateDto, user.id, org.orgId, user.isSuperAdmin);
  }

  /**
   * Git 仓库绑定（仅项目管理员）
   */
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get(':id/repo')
  getRepo(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.projectService.getRepoSettingsWithAuth(+id, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch(':id/repo')
  updateRepo(@Param('id') id: string, @Body() dto: UpdateProjectRepoDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.projectService.updateRepoSettingsWithAuth(+id, dto, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.projectService.remove(+id, user.id, org.orgId, user.isSuperAdmin);
  }

  /**
   * 获取甘特图数据（用于预览）
   */
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get(':id/gantt')
  async getGanttData(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.projectService.getGanttData(+id, user.id, org.orgId, user.isSuperAdmin);
  }

  /**
   * 导出甘特图为Excel文件
   */
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get(':id/gantt/export')
  async exportGantt(@Param('id') id: string, @Res() res: Response, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    const buffer = await this.projectService.exportGantt(+id, user.id, org.orgId, user.isSuperAdmin);
    const project = await this.projectService.findOne(+id, user.id, org.orgId, user.isSuperAdmin);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="project_${project.name}_gantt.xlsx"`);
    res.send(buffer);
  }

  // 项目成员管理（手动加入）
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get(':id/members')
  listMembers(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.projectService.listMembers(+id, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() body: { userId: number; role: 'admin' | 'member' }, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.projectService.addMember(+id, user.id, org.orgId, body, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch(':id/members/:userId/role')
  changeMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role: 'admin' | 'member' },
    @CurrentUser() user: RequestUser,
    @OrgDecorator() org: OrgContext,
  ) {
    return this.projectService.changeMemberRole(+id, user.id, org.orgId, +userId, body.role);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.projectService.removeMember(+id, user.id, org.orgId, +userId);
  }
}
