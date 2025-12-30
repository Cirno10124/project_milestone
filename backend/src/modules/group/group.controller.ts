import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GroupService } from './group.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgGuard } from '../../common/guards/org.guard';
import { Org as OrgDecorator } from '../../common/decorators/org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { OrgContext } from '../../common/guards/org.guard';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get()
  list(@OrgDecorator() org: OrgContext) {
    return this.groupService.list(org.orgId);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post()
  create(@OrgDecorator() org: OrgContext, @CurrentUser() user: RequestUser, @Body() body: { name: string }) {
    return this.groupService.create(org.orgId, user.id, body, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch(':id')
  update(@OrgDecorator() org: OrgContext, @CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { name?: string }) {
    return this.groupService.update(org.orgId, user.id, +id, body, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Delete(':id')
  remove(@OrgDecorator() org: OrgContext, @CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.groupService.remove(org.orgId, user.id, +id, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get(':id/members')
  listMembers(@OrgDecorator() org: OrgContext, @Param('id') id: string) {
    return this.groupService.listMembers(org.orgId, +id);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post(':id/members')
  addMember(
    @OrgDecorator() org: OrgContext,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { userId: number; role: 'admin' | 'member' },
  ) {
    return this.groupService.addMember(org.orgId, user.id, +id, body, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Delete(':id/members/:userId')
  removeMember(@OrgDecorator() org: OrgContext, @CurrentUser() user: RequestUser, @Param('id') id: string, @Param('userId') userId: string) {
    return this.groupService.removeMember(org.orgId, user.id, +id, +userId, user.isSuperAdmin);
  }
}


