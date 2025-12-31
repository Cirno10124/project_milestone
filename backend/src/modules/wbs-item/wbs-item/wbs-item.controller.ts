import { BadRequestException, Controller, Delete, Get, Param, Patch, Post, Body, Query, UseGuards } from '@nestjs/common';
import { WbsItemService } from './wbs-item.service';
import { CreateWbsItemDto } from '../dto/create-wbs-item.dto';
import { UpdateWbsItemDto } from '../dto/update-wbs-item.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrgGuard } from '../../../common/guards/org.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Org as OrgDecorator } from '../../../common/decorators/org.decorator';
import type { RequestUser } from '../../../common/guards/jwt-auth.guard';
import type { OrgContext } from '../../../common/guards/org.guard';

@Controller('wbs-items')
export class WbsItemController {
  constructor(private readonly wbsService: WbsItemService) {}

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post()
  create(@Body() dto: CreateWbsItemDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.wbsService.createWithAuth(dto, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get()
  findAll(@Query('projectId') projectId: string | undefined, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    if (!projectId) {
      if (!user.isSuperAdmin) throw new BadRequestException('缺少 projectId');
      return this.wbsService.findAllForOrg(org.orgId);
    }
    return this.wbsService.findByProject(+projectId, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.wbsService.findOneWithAuth(+id, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWbsItemDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.wbsService.updateWithAuth(+id, dto, user.id, org.orgId, user.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.wbsService.removeWithAuth(+id, user.id, org.orgId, user.isSuperAdmin);
  }
}
