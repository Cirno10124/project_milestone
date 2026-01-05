import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../project/entities/project.entity';
import { TaskService } from '../task/task/task.service';

type CommitLike = {
  id?: string;
  message?: string;
  timestamp?: string;
  url?: string;
};

function headerValue(headers: Record<string, string | string[] | undefined>, key: string) {
  const v = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(v)) return v[0];
  return v;
}

function clampPercent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseCommitMessage(message: string): null | { taskId: number; percentComplete?: number; status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold' } {
  const msg = (message ?? '').toString();
  if (!msg.trim()) return null;

  // 任务引用：#task:123 / task:123 / task#123
  const mTask = msg.match(/\b(?:#task\s*[:#]?\s*|task\s*[:#]?\s*)(\d+)\b/i);
  if (!mTask) return null;
  const taskId = Number(mTask[1]);
  if (!Number.isFinite(taskId) || taskId <= 0) return null;

  // 完成关键词：done / completed / 完成
  if (/\b(done|completed)\b|完成/.test(msg.toLowerCase())) {
    return { taskId, percentComplete: 100, status: 'completed' };
  }

  // 进度：progress:30% / 进度:30%
  const mPct = msg.match(/\b(?:progress|进度)\s*[:=]\s*(\d{1,3})\s*%?\b/i);
  if (mPct) {
    const pct = clampPercent(Number(mPct[1]));
    const status = pct >= 100 ? 'completed' : pct > 0 ? 'in_progress' : 'not_started';
    return { taskId, percentComplete: pct, status };
  }

  return { taskId };
}

@Injectable()
export class GitService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly taskService: TaskService,
  ) {}

  /**
   * 处理 push webhook（兼容 GitLab / Gitea 的常见 payload：body.commits）
   */
  async handlePushWebhook(projectId: number, headers: Record<string, string | string[] | undefined>, body: any) {
    if (!Number.isFinite(projectId) || projectId <= 0) throw new BadRequestException('非法 projectId');

    // 获取 token（支持 GitLab 默认 header）
    const token =
      headerValue(headers, 'x-project-webhook-token') ||
      headerValue(headers, 'x-gitlab-token') ||
      headerValue(headers, 'x-webhook-token');

    const proj = await this.projectRepo
      .createQueryBuilder('p')
      .where('p.id = :id', { id: projectId })
      .addSelect('p.repoWebhookSecret')
      .getOne();
    if (!proj) throw new NotFoundException(`Project #${projectId} not found`);

    if (!proj.repoWebhookSecret) throw new ForbiddenException('项目未配置 webhook token');
    if (!token || token !== proj.repoWebhookSecret) throw new ForbiddenException('webhook token 不匹配');

    if (!proj.gitSyncEnabled) {
      return { ok: true, ignored: true, reason: 'git sync disabled' };
    }

    const commits: CommitLike[] = Array.isArray(body?.commits) ? body.commits : [];
    if (!Array.isArray(commits) || commits.length === 0) {
      // 不是 push 或 payload 不包含 commits
      return { ok: true, ignored: true, reason: 'no commits' };
    }

    const applied: Array<{ taskId: number; percentComplete?: number; status?: string }> = [];

    for (const c of commits) {
      const parsed = parseCommitMessage(String(c?.message ?? ''));
      if (!parsed) continue;

      const patch: any = {};
      if (typeof parsed.percentComplete === 'number') patch.percentComplete = parsed.percentComplete;
      if (parsed.status) patch.status = parsed.status;
      // 没有任何可更新字段时跳过（只带 taskId 的 commit 暂不处理）
      if (Object.keys(patch).length === 0) continue;

      await this.taskService.updateFromWebhook(projectId, parsed.taskId, patch);
      applied.push({ taskId: parsed.taskId, ...patch });
    }

    await this.projectRepo.update({ id: projectId } as any, { lastGitEventAt: new Date() } as any);

    return { ok: true, appliedCount: applied.length, applied };
  }
}


