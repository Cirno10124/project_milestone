import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendEmailCodeDto, VerifyEmailCodeDto } from './dto/email-code.dto';
import { EmailCodeService } from './email-code.service';
import { EmailSenderService } from './email-sender.service';
import {
  CreatePasswordResetTokenDto,
  ResetPasswordDto,
} from './dto/password-reset.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly emailCodeService: EmailCodeService,
    private readonly emailSender: EmailSenderService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * 发送邮箱验证码（注册/重置密码）
   * 注意：应避免邮箱枚举。这里统一返回 ok=true。
   */
  @Post('email/send-code')
  async sendEmailCode(@Body() dto: SendEmailCodeDto) {
    try {
      const { sent, code } = await this.emailCodeService.sendCode(
        dto.email,
        dto.purpose,
      );
      this.logger.log(
        `sendEmailCode purpose=${dto.purpose} email=${dto.email} sent=${sent}`,
      );
      if (sent && code) {
        // 开发期兜底：禁用真实发信，避免被 SMTP/网络环境卡住功能联调
        // 用法：
        // - DEV_EMAIL_SENDER=console   (仅打印验证码到后端日志)
        // - DEV_RETURN_EMAIL_CODE=1   (可选：把验证码回传给前端，生产环境不要开)
        const isProd = process.env.NODE_ENV === 'production';
        const devEmailSender = process.env.DEV_EMAIL_SENDER;
        const devReturnEmailCode = process.env.DEV_RETURN_EMAIL_CODE === '1';
        if (!isProd && devEmailSender === 'console') {
          this.logger.warn(
            `DEV_EMAIL_SENDER=console: purpose=${dto.purpose} email=${dto.email} code=${code}`,
          );
          return devReturnEmailCode
            ? { ok: true, devCode: code }
            : { ok: true };
        }
        await this.emailSender.sendVerificationCode({
          to: dto.email,
          purpose: dto.purpose,
          code,
          ttlSeconds: +(process.env.EMAIL_CODE_TTL_SECONDS || 600),
        });
      }
      return { ok: true };
    } catch (err) {
      const detail =
        err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      this.logger.error(
        `sendEmailCode failed purpose=${dto.purpose} email=${dto.email}`,
        detail,
      );
      throw err;
    }
  }

  /**
   * 校验邮箱验证码（仅校验+消费，不返回额外信息）
   */
  @Post('email/verify-code')
  async verifyEmailCode(@Body() dto: VerifyEmailCodeDto) {
    await this.emailCodeService.verifyAndConsume(
      dto.email,
      dto.purpose,
      dto.code,
    );
    return { ok: true };
  }

  /**
   * 重置密码：验证码通过后换取 resetToken
   */
  @Post('password/reset-token')
  async createResetToken(
    @Body() dto: CreatePasswordResetTokenDto,
  ): Promise<{ resetToken: string; expiresInSeconds: number }> {
    const auth = this.authService as unknown as {
      createPasswordResetToken(
        p: CreatePasswordResetTokenDto,
      ): Promise<{ resetToken: string; expiresInSeconds: number }>;
    };
    return await auth.createPasswordResetToken(dto);
  }

  /**
   * 重置密码：使用 resetToken 提交新密码
   */
  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ ok: true }> {
    const auth = this.authService as unknown as {
      resetPassword(p: ResetPasswordDto): Promise<{ ok: true }>;
    };
    return await auth.resetPassword(dto);
  }

  /**
   * 获取当前用户信息
   */
  @Get('me')
  async getMe(@Headers('authorization') authHeader: string) {
    if (!authHeader) throw new UnauthorizedException();
    const token = authHeader.replace(/^Bearer\s+/i, '');
    return this.authService.getProfile(token);
  }
}
