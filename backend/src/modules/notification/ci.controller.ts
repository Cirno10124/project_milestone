import { Body, Controller, ForbiddenException, Headers, Logger, Post } from '@nestjs/common';
import { CiReportDto } from './dto/ci-report.dto';
import { NotificationService } from './notification.service';

@Controller('ci')
export class CiController {
  private readonly logger = new Logger(CiController.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * CI 上报入口（由 GitLab CI job 调用）
   * - Header: X-CI-Token: <CI_WEBHOOK_SECRET>
   */
  @Post('report')
  async report(@Headers('x-ci-token') token: string | undefined, @Body() dto: CiReportDto) {
    const secret = (process.env.CI_WEBHOOK_SECRET || '').trim();
    if (!secret) {
      this.logger.error('CI_WEBHOOK_SECRET 未配置，拒绝接收 CI 上报');
      throw new ForbiddenException('CI webhook 未启用');
    }
    if (!token || token !== secret) throw new ForbiddenException('CI token 不匹配');

    return await this.notificationService.notifyCiResult(dto);
  }
}

