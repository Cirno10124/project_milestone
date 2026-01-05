import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { GitService } from './git.service';

@Controller('git')
export class GitController {
  constructor(private readonly gitService: GitService) {}

  /**
   * Git Webhook（push 事件）
   * - URL: /git/webhook/projects/:projectId
   * - Header: X-Project-Webhook-Token: <token> （也兼容 X-Gitlab-Token）
   */
  @Post('webhook/projects/:projectId')
  handleWebhook(
    @Param('projectId') projectId: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: any,
  ) {
    return this.gitService.handlePushWebhook(Number(projectId), headers, body);
  }
}
