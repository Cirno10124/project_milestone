import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GitService } from './git.service';

function makeProjectRepoMock(project: any) {
  const qb = {
    where: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(project),
  };
  return {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    __qb: qb,
  };
}

describe('GitService', () => {
  it('rejects when webhook token mismatches', async () => {
    const projectRepo: any = makeProjectRepoMock({ id: 1, repoWebhookSecret: 'secret', gitSyncEnabled: true });
    const taskService: any = { updateFromWebhook: jest.fn() };
    const svc = new GitService(projectRepo, taskService);

    await expect(
      svc.handlePushWebhook(1, { 'x-gitlab-token': 'wrong' }, { commits: [{ message: '#task:1 progress:10%' }] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns ignored when git sync disabled', async () => {
    const projectRepo: any = makeProjectRepoMock({ id: 1, repoWebhookSecret: 'secret', gitSyncEnabled: false });
    const taskService: any = { updateFromWebhook: jest.fn() };
    const svc = new GitService(projectRepo, taskService);

    const res = await svc.handlePushWebhook(1, { 'x-gitlab-token': 'secret' }, { commits: [{ message: '#task:1 progress:10%' }] });
    expect(res).toEqual({ ok: true, ignored: true, reason: 'git sync disabled' });
    expect(taskService.updateFromWebhook).not.toHaveBeenCalled();
    expect(projectRepo.update).not.toHaveBeenCalled();
  });

  it('applies progress update from commit message and updates lastGitEventAt', async () => {
    const projectRepo: any = makeProjectRepoMock({ id: 1, repoWebhookSecret: 'secret', gitSyncEnabled: true });
    const taskService: any = { updateFromWebhook: jest.fn().mockResolvedValue({ id: 12 }) };
    const svc = new GitService(projectRepo, taskService);

    const res = await svc.handlePushWebhook(
      1,
      { 'x-gitlab-token': 'secret' },
      { commits: [{ message: 'feat: something #task:12 progress:30%' }] },
    );

    expect(taskService.updateFromWebhook).toHaveBeenCalledWith(1, 12, { percentComplete: 30, status: 'in_progress' });
    expect(projectRepo.update).toHaveBeenCalled();
    expect(res.ok).toBe(true);
    expect(res.appliedCount).toBe(1);
    expect(res.applied[0]).toMatchObject({ taskId: 12, percentComplete: 30, status: 'in_progress' });
  });

  it('treats done as completed(100%)', async () => {
    const projectRepo: any = makeProjectRepoMock({ id: 1, repoWebhookSecret: 'secret', gitSyncEnabled: true });
    const taskService: any = { updateFromWebhook: jest.fn().mockResolvedValue({ id: 99 }) };
    const svc = new GitService(projectRepo, taskService);

    const res = await svc.handlePushWebhook(
      1,
      { 'x-project-webhook-token': 'secret' },
      { commits: [{ message: 'fix: close #task:99 done' }] },
    );

    expect(taskService.updateFromWebhook).toHaveBeenCalledWith(1, 99, { percentComplete: 100, status: 'completed' });
    expect(res.appliedCount).toBe(1);
  });

  it('returns ignored when payload has no commits', async () => {
    const projectRepo: any = makeProjectRepoMock({ id: 1, repoWebhookSecret: 'secret', gitSyncEnabled: true });
    const taskService: any = { updateFromWebhook: jest.fn() };
    const svc = new GitService(projectRepo, taskService);

    const res = await svc.handlePushWebhook(1, { 'x-gitlab-token': 'secret' }, { foo: 'bar' });
    expect(res).toEqual({ ok: true, ignored: true, reason: 'no commits' });
    expect(taskService.updateFromWebhook).not.toHaveBeenCalled();
    expect(projectRepo.update).not.toHaveBeenCalled();
  });

  it('throws NotFound when project does not exist', async () => {
    const projectRepo: any = makeProjectRepoMock(null);
    const taskService: any = { updateFromWebhook: jest.fn() };
    const svc = new GitService(projectRepo, taskService);

    await expect(svc.handlePushWebhook(1, { 'x-gitlab-token': 'secret' }, { commits: [] })).rejects.toBeInstanceOf(NotFoundException);
  });
});


