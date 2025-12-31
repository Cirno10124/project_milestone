import { BadRequestException, Controller, Delete, Get, Param, Patch, Post, Body, Query, UseGuards } from '@nestjs/common';
import { DependencyService } from './dependency.service';
import { CreateDependencyDto } from '../dto/create-dependency.dto';
import { UpdateDependencyDto } from '../dto/update-dependency.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrgGuard } from '../../../common/guards/org.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Org as OrgDecorator } from '../../../common/decorators/org.decorator';
import type { RequestUser } from '../../../common/guards/jwt-auth.guard';
import type { OrgContext } from '../../../common/guards/org.guard';

@Controller('dependencies')
export class DependencyController {
  constructor(private readonly depService: DependencyService) {}

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post()
  create(@Body() dto: CreateDependencyDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.depService.createWithAuth(dto, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get()
  findAll(@Query('projectId') projectId: string | undefined, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    if (!projectId) {
      if (!user.isSuperAdmin) throw new BadRequestException('缺少 projectId');
      return this.depService.findAllForOrg(org.orgId);
    }
    return this.depService.findByProject(+projectId, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.depService.findOneWithAuth(+id, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDependencyDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.depService.updateWithAuth(+id, dto, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.depService.removeWithAuth(+id, user.id, org.orgId, user.isSuperAdmin);
  }
}
