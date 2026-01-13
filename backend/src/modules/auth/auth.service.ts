import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailCodeService } from './email-code.service';
import type Redis from 'ioredis';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    private readonly jwtService: JwtService,
    private readonly emailCodeService: EmailCodeService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (exists) throw new ConflictException('用户名已存在');
    const existsEmail = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existsEmail) throw new ConflictException('邮箱已存在');
    await this.emailCodeService.verifyAndConsume(
      dto.email,
      'register',
      dto.code,
    );
    const hash = await bcrypt.hash(dto.password, 10);
    const isSuper =
      process.env.SUPER_ADMIN_USERNAME &&
      process.env.SUPER_ADMIN_USERNAME === dto.username;
    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      emailVerified: true,
      passwordHash: hash,
      isSuperAdmin: !!isSuper,
    });
    return this.userRepo.save(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (!user) throw new UnauthorizedException('用户名或密码错误');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('用户名或密码错误');
    const payload = {
      sub: user.id,
      username: user.username,
      isSuperAdmin: !!user.isSuperAdmin,
    };
    return { token: this.jwtService.sign(payload) };
  }

  verifyToken(token: string): {
    sub: number;
    username: string;
    isSuperAdmin?: boolean;
  } {
    return this.jwtService.verify(token);
  }

  /**
   * 根据 JWT Token 返回当前用户信息
   */
  async getProfile(token: string) {
    try {
      const payload = this.verifyToken(token);
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        ciNotifyEnabled: !!user.ciNotifyEnabled,
        isSuperAdmin: !!user.isSuperAdmin,
      };
    } catch {
      throw new UnauthorizedException();
    }
  }

  async getMyNotificationSettings(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return { ciNotifyEnabled: !!user.ciNotifyEnabled } as const;
  }

  async updateMyNotificationSettings(userId: number, patch: { ciNotifyEnabled?: boolean }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (patch.ciNotifyEnabled !== undefined) user.ciNotifyEnabled = !!patch.ciNotifyEnabled;
    await this.userRepo.save(user);
    return { ciNotifyEnabled: !!user.ciNotifyEnabled } as const;
  }

  /**
   * 重置密码：验证码通过后签发短期 resetToken（避免“验证码直接改密”被重放）
   */
  async createPasswordResetToken(params: {
    email: string;
    code: string;
  }): Promise<{ resetToken: string; expiresInSeconds: number }> {
    const user = await this.userRepo.findOne({
      where: { email: params.email.toLowerCase() },
    });
    if (!user) {
      // 防枚举：统一错误
      throw new BadRequestException('验证码已过期或不存在');
    }
    await this.emailCodeService.verifyAndConsume(
      params.email,
      'reset_password',
      params.code,
    );

    const token = randomBytes(32).toString('base64url');
    const ttl = +(process.env.PASSWORD_RESET_TOKEN_TTL_SECONDS || 900);
    await this.redis.set(
      `pwd_reset_token:${token}`,
      String(user.id),
      'EX',
      ttl,
    );
    return { resetToken: token, expiresInSeconds: ttl } as const;
  }

  async resetPassword(params: {
    resetToken: string;
    newPassword: string;
  }): Promise<{ ok: true }> {
    const k = `pwd_reset_token:${params.resetToken}`;
    const userIdRaw = await this.redis.get(k);
    if (!userIdRaw) throw new BadRequestException('重置凭证已过期或无效');
    await this.redis.del(k);

    const userId = Number(userIdRaw);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('重置凭证已过期或无效');

    const hash = await bcrypt.hash(params.newPassword, 10);
    user.passwordHash = hash;
    await this.userRepo.save(user);
    return { ok: true } as const;
  }
}
