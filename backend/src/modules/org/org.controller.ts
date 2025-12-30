import { Body, Controller, Get, Patch, Post, UseGuards, Param } from '@nestjs/common';
import { OrgService } from './org.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
import { OrgGuard } from '../../common/guards/org.guard';
import { Org as OrgDecorator } from '../../common/decorators/org.decorator';
import type { OrgContext } from '../../common/guards/org.guard';

@Controller()
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @UseGuards(JwtAuthGuard)
  @Get('orgs')
  listOrgs(@CurrentUser() user: RequestUser) {
    return this.orgService.listMyOrgs(user.id);
  }

  // 获取当前组织信息（用于前端回显 orgName；依赖 X-Org-Id）
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get('orgs/current')
  getCurrentOrg(@OrgDecorator() org: OrgContext) {
    return this.orgService.getOrg(org.orgId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orgs')
  createOrg(@Body() dto: CreateOrgDto, @CurrentUser() user: RequestUser) {
    return this.orgService.createOrg(dto, user.id);
  }

  // 组织内用户列表（给前端选人用）
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get('orgs/users')
  listOrgUsers(@OrgDecorator() org: OrgContext) {
    return this.orgService.listOrgUsers(org.orgId);
  }

  // 组织管理员：把某个 username 加入当前 org（MVP：用用户名加入）
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post('orgs/users')
  addOrgUser(
    @OrgDecorator() org: OrgContext,
    @CurrentUser() user: RequestUser,
    @Body() body: { username: string },
  ) {
    return this.orgService.addUserToOrg(org.orgId, user.id, body.username, user.isSuperAdmin);
  }

  // 组织管理员：设置用户部门归属（单部门）
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch('orgs/users/:userId/group')
  setUserGroup(
    @OrgDecorator() org: OrgContext,
    @CurrentUser() user: RequestUser,
    @Param('userId') userId: string,
    @Body() body: { groupId: number | null; roleInGroup: 'admin' | 'member' },
  ) {
    return this.orgService.setUserGroup(org.orgId, user.id, Number(userId), body.groupId ?? null, body.roleInGroup ?? 'member', user.isSuperAdmin);
  }
}


