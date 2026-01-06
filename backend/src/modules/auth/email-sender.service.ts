import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import nodemailer from 'nodemailer';

type NodemailerLike = {
  createTransport(options: unknown): {
    sendMail(message: unknown): Promise<unknown>;
  };
};

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);
  private readonly transporter = (
    nodemailer as unknown as NodemailerLike
  ).createTransport({
    host: process.env.SMTP_HOST,
    port: +(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  private from() {
    const email = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const name = process.env.FROM_NAME || 'Project Milestone';
    return email ? `${name} <${email}>` : undefined;
  }

  async sendVerificationCode(params: {
    to: string;
    purpose: 'register' | 'reset_password';
    code: string;
    ttlSeconds: number;
  }) {
    // 提前给出更清晰的配置错误（否则 nodemailer 会抛较隐晦的错误）
    if (!process.env.SMTP_HOST) {
      this.logger.error('SMTP_HOST 未配置，无法发送邮件验证码');
      throw new InternalServerErrorException(
        '邮件服务未配置（缺少 SMTP_HOST）',
      );
    }
    const subject =
      params.purpose === 'register' ? '注册验证码' : '重置密码验证码';
    const text = [
      `你的验证码是：${params.code}`,
      `有效期：${Math.floor(params.ttlSeconds / 60)} 分钟`,
      '',
      '如果不是你本人操作，请忽略本邮件。',
    ].join('\n');

    try {
      await this.transporter.sendMail({
        from: this.from(),
        to: params.to,
        subject,
        text,
      });
    } catch (err) {
      // 记录内部错误，便于定位（例如 SMTP 连接/认证/证书问题）
      const detail =
        err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      this.logger.error(
        `邮件发送失败 to=${params.to} purpose=${params.purpose}`,
        detail,
      );
      // 不向客户端暴露内部错误细节
      throw new InternalServerErrorException('邮件发送失败，请稍后重试');
    }
  }
}
