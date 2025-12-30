import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from '../entities/score.entity';
import { ComputeScoreDto } from '../dto/compute-score.dto';
import { Project } from '../../project/entities/project.entity';

@Injectable()
export class ScoreService {
  constructor(
    @InjectRepository(Score) private readonly scoreRepo: Repository<Score>,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
  ) {}

  async computeScore(dto: ComputeScoreDto): Promise<Score> {
    const project = await this.projectRepo.findOne({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException(`Project #${dto.projectId} not found`);

    // 基础分计算
    const milestone = Math.floor(dto.milestonePercent / 10) * 1; // 每10% +1
    const foundation = dto.moduleCompleteness + dto.e2eAvailability + milestone;

    // 时间得分
    let timeScore = 0;
    // difficulty 容错比例
    const tolMap = { E: 0.05, N: 0.10, H: 0.15, L: 0.20 };
    const tolDays = dto.baselineDays * tolMap[dto.difficulty];
    if (dto.actualDeliveryDays <= dto.baselineDays + tolDays) {
      timeScore = 15;
    } else {
      const over = dto.actualDeliveryDays - (dto.baselineDays + tolDays);
      const dec = Math.floor(over / dto.baselineDays * 10) * 5; // 每10% -5
      timeScore = Math.max(0, 15 - dec);
    }
    // 提前交付
    if ((dto.earlyDeliveryDays ?? 0) > 0 && foundation >= 55) {
      const bonus = Math.min(Math.floor((dto.earlyDeliveryDays! / dto.baselineDays!) * 10) * 5, 20);
      timeScore = Math.min(15 + bonus, 15 + 20);
    }

    // 质量分合计
    const quality = dto.algorithmQuality + dto.architectureQuality + dto.codeStyle +
      ((dto.securityScanScore + dto.e2eSecurityTestScore + dto.authSessionScore + dto.configHardeningScore) / 4) * 5 / 100;
    // security 部分按比例映射到 0-5
    // 这里quality 包含 algorithm(5)+architecture(10)+codeStyle(5)+security(5)
    
    const score = this.scoreRepo.create({
      project,
      moduleCompleteness: dto.moduleCompleteness,
      e2eAvailability: dto.e2eAvailability,
      milestone,
      timeScore,
      algorithmQuality: dto.algorithmQuality,
      architectureQuality: dto.architectureQuality,
      codeStyle: dto.codeStyle,
      security: ((dto.securityScanScore + dto.e2eSecurityTestScore + dto.authSessionScore + dto.configHardeningScore) / 4) * 5 / 100,
      foundationScore: foundation,
      qualityScore: quality,
      totalScore: foundation + quality,
    });

    return this.scoreRepo.save(score);
  }
}
