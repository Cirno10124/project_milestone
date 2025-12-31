import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from '../entities/score.entity';
import { ComputeScoreDto } from '../dto/compute-score.dto';
import { Project } from '../../project/entities/project.entity';
import { ProjectMember } from '../../project/entities/project-member.entity';

@Injectable()
export class ScoreService {
  constructor(
    @InjectRepository(Score) private readonly scoreRepo: Repository<Score>,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember) private readonly projectMemberRepo: Repository<ProjectMember>,
  ) {}

  async computeScoreWithAuth(dto: ComputeScoreDto, userId: number, orgId: number, isSuperAdmin = false): Promise<Score> {
    await this.assertProjectAdmin(dto.projectId, userId, orgId, isSuperAdmin);
    return this.computeScore(dto, orgId);
  }

  async computeScore(dto: ComputeScoreDto, orgId?: number): Promise<Score> {
    const project = orgId ? await this.getProjectEnsuringOrg(dto.projectId, orgId) : await this.projectRepo.findOne({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException(`Project #${dto.projectId} not found`);

    // 基础分计算
    const milestone = Math.floor(dto.milestonePercent / 10) * 1; // 每10% +1
    const foundationScore = dto.moduleCompleteness + dto.e2eAvailability + milestone;

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
    if ((dto.earlyDeliveryDays ?? 0) > 0 && foundationScore >= 55) {
      const bonus = Math.min(Math.floor((dto.earlyDeliveryDays! / dto.baselineDays!) * 10) * 5, 20);
      timeScore = Math.min(15 + bonus, 15 + 20);
    }

    // 质量分合计
    const security = ((dto.securityScanScore + dto.e2eSecurityTestScore + dto.authSessionScore + dto.configHardeningScore) / 4) * 5 / 100;
    const qualityScore = timeScore + dto.algorithmQuality + dto.architectureQuality + dto.codeStyle + security;
    // security 部分按比例映射到 0-5
    // qualityScore 包含 time(15)+algorithm(5)+architecture(10)+codeStyle(5)+security(5)
    
    const score = this.scoreRepo.create({
      project,
      moduleCompleteness: dto.moduleCompleteness,
      e2eAvailability: dto.e2eAvailability,
      milestone,
      timeScore,
      algorithmQuality: dto.algorithmQuality,
      architectureQuality: dto.architectureQuality,
      codeStyle: dto.codeStyle,
      security,
      foundationScore,
      qualityScore,
      totalScore: foundationScore + qualityScore,
    });

    return this.scoreRepo.save(score);
  }

  private async assertProjectAdmin(projectId: number, userId: number, orgId: number, isSuperAdmin = false) {
    await this.getProjectEnsuringOrg(projectId, orgId);
    if (isSuperAdmin) return;
    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId } });
    if (!pm) throw new ForbiddenException('无项目权限');
    if (pm.role !== 'admin') throw new ForbiddenException('需要项目管理员权限');
  }

  private async getProjectEnsuringOrg(projectId: number, orgId: number): Promise<Project> {
    const p = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!p) throw new NotFoundException(`Project #${projectId} not found`);
    // MySQL BIGINT 可能在运行时表现为 string；统一做数值化比较避免误判
    if (Number((p as any).orgId) !== Number(orgId)) throw new ForbiddenException('无项目权限');
    return p;
  }
}
