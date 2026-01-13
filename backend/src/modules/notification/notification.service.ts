import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailSenderService } from '../auth/email-sender.service';
import { Project, type ProjectNotifyScope } from '../project/entities/project.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { UserAccount } from '../auth/entities/user.entity';
import { Task } from '../task/entities/task.entity';
import { WbsItem } from '../wbs-item/entities/wbs-item.entity';

function uniqEmails(emails: Array<string | null | undefined>) {
  const set = new Set<string>();
  for (const e of emails) {
    const v = (e ?? '').trim().toLowerCase();
    if (!v) continue;
    set.add(v);
  }
  return [...set];
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailSender: EmailSenderService,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(WbsItem)
    private readonly wbsRepo: Repository<WbsItem>,
  ) {}

  private async getProjectRecipientEmails(projectId: number, scope: ProjectNotifyScope) {
    const where: any = { projectId };
    if (scope === 'admins') where.role = 'admin';
    const rows = await this.projectMemberRepo.find({ where, relations: ['user'] });
    const emails = rows
      .map((r) => (r.user?.emailVerified ? r.user?.email : null))
      .filter((e) => !!e);
    return uniqEmails(emails as string[]);
  }

  async notifyTaskCompleted(params: { projectId: number; taskId: number }) {
    const proj = await this.projectRepo.findOne({ where: { id: params.projectId } as any });
    if (!proj) return;
    if (!proj.notifyTaskComplete) return;

    const task = await this.taskRepo.findOne({ where: { id: params.taskId }, relations: ['wbsItem'] });
    if (!task) return;

    const subject = `任务完成通知：${task.name}`;
    const frontend = (process.env.FRONTEND_BASE_URL || '').trim().replace(/\/+$/, '');
    const link = frontend ? `${frontend}/projects/${params.projectId}` : '';

    const text = [
      `项目：${proj.name}`,
      `WBS：${task.wbsItem?.name || '-'}`,
      `任务：${task.name}`,
      '',
      link ? `打开项目：${link}` : undefined,
    ]
      .filter(Boolean)
      .join('\n');

    const toList = await this.getProjectRecipientEmails(
      params.projectId,
      (proj.notifyTaskCompleteScope || 'admins') as ProjectNotifyScope,
    );

    if (toList.length === 0) return;

    // 简化：逐个发送，避免把所有人邮箱暴露在同一封 To 里
    for (const to of toList) {
      await this.emailSender.sendTextMail({ to, subject, text });
    }
  }

  async notifyMilestoneCompleted(params: { projectId: number; wbsItemId: number }) {
    const proj = await this.projectRepo.findOne({ where: { id: params.projectId } as any });
    if (!proj) return;
    if (!proj.notifyMilestoneComplete) return;

    const wbs = await this.wbsRepo.findOne({ where: { id: params.wbsItemId } });
    if (!wbs) return;

    const subject = `里程碑完成通知：${wbs.name}`;
    const frontend = (process.env.FRONTEND_BASE_URL || '').trim().replace(/\/+$/, '');
    const link = frontend ? `${frontend}/projects/${params.projectId}` : '';
    const text = [
      `项目：${proj.name}`,
      `里程碑（WBS）：${wbs.name}`,
      '',
      link ? `打开项目：${link}` : undefined,
    ]
      .filter(Boolean)
      .join('\n');

    const toList = await this.getProjectRecipientEmails(
      params.projectId,
      (proj.notifyMilestoneCompleteScope || 'admins') as ProjectNotifyScope,
    );
    if (toList.length === 0) return;
    for (const to of toList) {
      await this.emailSender.sendTextMail({ to, subject, text });
    }
  }

  async notifyCiResult(params: {
    status: 'success' | 'failed' | 'canceled' | 'running' | 'pending';
    projectPath: string;
    ref: string;
    sha: string;
    title?: string;
    userEmail: string;
    userName?: string;
    errorLog?: string;
  }) {
    const userEmail = (params.userEmail || '').trim().toLowerCase();
    if (!userEmail) return { sent: false as const, reason: 'missing_email' as const };

    // 仅对系统内用户生效（个人可配置开关）
    const user = await this.userRepo.findOne({ where: { email: userEmail } as any });
    if (!user) return { sent: false as const, reason: 'user_not_found' as const };
    if (!user.emailVerified) return { sent: false as const, reason: 'email_not_verified' as const };
    if (!user.ciNotifyEnabled) return { sent: false as const, reason: 'disabled' as const };

    const ok = params.status === 'success';
    const subject = ok
      ? `CI 通过：${params.projectPath} @ ${params.ref}`
      : `CI 失败：${params.projectPath} @ ${params.ref}`;

    const err = (params.errorLog || '').trim();
    const max = 4000;
    const errSnippet = err ? (err.length > max ? `${err.slice(0, max)}\n...（已截断）` : err) : '';

    const text = [
      `状态：${params.status}`,
      `项目：${params.projectPath}`,
      `分支/标签：${params.ref}`,
      `提交：${params.sha}${params.title ? ` - ${params.title}` : ''}`,
      `提交者：${params.userName || user.username} <${userEmail}>`,
      '',
      !ok && errSnippet ? '错误日志片段：' : undefined,
      !ok && errSnippet ? errSnippet : undefined,
    ]
      .filter(Boolean)
      .join('\n');

    await this.emailSender.sendTextMail({ to: userEmail, subject, text });
    return { sent: true as const };
  }
}

