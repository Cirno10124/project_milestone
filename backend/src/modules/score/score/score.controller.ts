import { Controller, Post, Body } from '@nestjs/common';
import { ScoreService } from './score.service';
import { ComputeScoreDto } from '../dto/compute-score.dto';

@Controller('scores')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Post('compute')
  compute(@Body() dto: ComputeScoreDto) {
    return this.scoreService.computeScore(dto);
  }
}
