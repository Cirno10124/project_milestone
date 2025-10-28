import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Project } from '../../project/entities/project.entity';

@Entity('score')
export class Score {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project)
  project: Project;

  // 基础分项
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  moduleCompleteness: number; // 模块完备 (0-25)

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  e2eAvailability: number; // 端到端可用 (0-25)

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  milestone: number; // 里程碑分 (0-10)

  // 质量分项
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  timeScore: number; // 时间得分 (0-15)

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  algorithmQuality: number; // 算法质量 (0-5)

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  architectureQuality: number; // 功能架构 (0-10)

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  codeStyle: number; // 代码规范 (0-5)

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  security: number; // 安全测试 (0-5)

  // 总分
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  foundationScore: number; // 基础总分 (moduleCompleteness+e2eAvailability+milestone)

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  qualityScore: number; // 质量总分 (timeScore+algorithmQuality+architectureQuality+codeStyle+security)

  @Column('decimal', { precision: 6, scale: 2, default: 0 })
  totalScore: number; // foundationScore + qualityScore
}

