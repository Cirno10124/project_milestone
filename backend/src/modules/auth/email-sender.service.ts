import { Injectable, InternalServerErrorException } from '@nestjs/common';
import nodemailer from 'nodemailer';

type NodemailerLike = {
  createTransport(options: unknown): {
    sendMail(message: unknown): Promise<unknown>;
  };
};

@Injectable()
export class EmailSenderService {
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
    } catch {
      // 不向客户端暴露内部错误细节
      throw new InternalServerErrorException('邮件发送失败，请稍后重试');
    }
  }
}
