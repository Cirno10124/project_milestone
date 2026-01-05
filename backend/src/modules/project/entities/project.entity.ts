import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { WbsItem } from '../../wbs-item/entities/wbs-item.entity';

@Entity('project')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'org_id', type: 'bigint' })
  orgId: number;

  @Column({ length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  /**
   * Git 仓库绑定（内网 GitLab / Gitea / 其他 Git 服务）
   */
  @Column({ name: 'repo_url', type: 'varchar', length: 512, nullable: true })
  repoUrl?: string;

  @Column({ name: 'repo_provider', type: 'varchar', length: 32, nullable: true })
  repoProvider?: string;

  @Column({ name: 'repo_default_branch', type: 'varchar', length: 255, nullable: true })
  repoDefaultBranch?: string;

  // webhook 鉴权 token（不在普通查询中返回）
  @Column({ name: 'repo_webhook_secret', type: 'varchar', length: 128, nullable: true, select: false })
  repoWebhookSecret?: string;

  @Column({ name: 'git_sync_enabled', type: 'tinyint', default: 0 })
  gitSyncEnabled?: boolean;

  @Column({ name: 'last_git_event_at', type: 'datetime', nullable: true })
  lastGitEventAt?: Date;

  @OneToMany(() => WbsItem, (item) => item.project)
  wbsItems: WbsItem[];
}
