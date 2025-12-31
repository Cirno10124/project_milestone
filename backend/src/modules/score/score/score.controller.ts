import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ScoreService } from './score.service';
import { ComputeScoreDto } from '../dto/compute-score.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrgGuard } from '../../../common/guards/org.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Org as OrgDecorator } from '../../../common/decorators/org.decorator';
import type { RequestUser } from '../../../common/guards/jwt-auth.guard';
import type { OrgContext } from '../../../common/guards/org.guard';

@Controller('scores')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post('compute')
  compute(@Body() dto: ComputeScoreDto, @CurrentUser() user: RequestUser, @OrgDecorator() org: OrgContext) {
    return this.scoreService.computeScoreWithAuth(dto, user.id, org.orgId, user.isSuperAdmin);
  }
}
