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

type EmailSenderProvider = 'smtp' | 'http';

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);

  private readonly provider = (process.env.EMAIL_SENDER_PROVIDER ||
    'smtp') as EmailSenderProvider;

  // Generic HTTP email API (you provide endpoint / auth)
  private readonly httpEndpoint = process.env.EMAIL_HTTP_ENDPOINT;
  private readonly httpAuthHeader =
    process.env.EMAIL_HTTP_AUTH_HEADER || 'Authorization';
  private readonly httpBearerToken =
    process.env.EMAIL_HTTP_BEARER_TOKEN || process.env.EMAIL_HTTP_TOKEN;

  private readonly smtpHost = process.env.SMTP_HOST;
  private readonly smtpPort = +(process.env.SMTP_PORT || 587);
  private readonly smtpSecure =
    String(process.env.SMTP_SECURE || 'false') === 'true';
  private readonly smtpRequireTLS =
    String(process.env.SMTP_REQUIRE_TLS || 'false') === 'true' ||
    (!this.smtpSecure && this.smtpPort === 587);
  private readonly connectionTimeoutMs = +(
    process.env.SMTP_CONNECTION_TIMEOUT_MS || 20000
  );
  private readonly greetingTimeoutMs = +(
    process.env.SMTP_GREETING_TIMEOUT_MS || 20000
  );
  private readonly socketTimeoutMs = +(
    process.env.SMTP_SOCKET_TIMEOUT_MS || 30000
  );
  private smtpTransporter:
    | ReturnType<NodemailerLike['createTransport']>
    | undefined;

  private from() {
    const email = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const name = process.env.FROM_NAME || 'Project Milestone';
    return email ? `${name} <${email}>` : undefined;
  }

  private getSmtpTransporter() {
    if (this.smtpTransporter) return this.smtpTransporter;
    this.smtpTransporter = (
      nodemailer as unknown as NodemailerLike
    ).createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpSecure,
      // 对 587（STARTTLS）默认强制升级 TLS，避免服务端在明文阶段直接断开
      requireTLS: this.smtpRequireTLS,
      connectionTimeout: this.connectionTimeoutMs,
      greetingTimeout: this.greetingTimeoutMs,
      socketTimeout: this.socketTimeoutMs,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
    return this.smtpTransporter;
  }

  private async sendViaHttp(params: {
    to: string;
    subject: string;
    text: string;
  }) {
    if (!this.httpEndpoint) {
      this.logger.error(
        'EMAIL_HTTP_ENDPOINT 未配置，无法通过 HTTP 邮件 API 发信',
      );
      throw new InternalServerErrorException(
        '邮件服务未配置（缺少 EMAIL_HTTP_ENDPOINT）',
      );
    }

    const from = this.from();
    if (!from) {
      this.logger.error('FROM_EMAIL/SMTP_USER 未配置，无法构造发件人信息');
      throw new InternalServerErrorException(
        '邮件服务未配置（缺少 FROM_EMAIL）',
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.httpBearerToken) {
      headers[this.httpAuthHeader] = `Bearer ${this.httpBearerToken}`;
    }

    // 注意：这是“通用”payload，你可以在中转服务里适配任意邮件厂商（SendGrid/Mailgun/Resend/...）
    const body = {
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
    };

    const res = await fetch(this.httpEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      this.logger.error(
        `HTTP 邮件 API 调用失败 status=${res.status} endpoint=${this.httpEndpoint}`,
        errText,
      );
      throw new InternalServerErrorException('邮件发送失败，请稍后重试');
    }
  }

  async sendTextMail(params: { to: string; subject: string; text: string }) {
    try {
      if (this.provider === 'http') {
        await this.sendViaHttp(params);
        return;
      }

      // SMTP（默认）
      if (!this.smtpHost) {
        this.logger.error('SMTP_HOST 未配置，无法发送邮件');
        throw new InternalServerErrorException('邮件服务未配置（缺少 SMTP_HOST）');
      }
      await this.getSmtpTransporter().sendMail({
        from: this.from(),
        to: params.to,
        subject: params.subject,
        text: params.text,
      });
    } catch (err) {
      const detail =
        err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      this.logger.error(`邮件发送失败 to=${params.to}`, detail);
      throw new InternalServerErrorException('邮件发送失败，请稍后重试');
    }
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

    // 复用通用发信（验证码同样走此路径）
    await this.sendTextMail({ to: params.to, subject, text });
  }
}
