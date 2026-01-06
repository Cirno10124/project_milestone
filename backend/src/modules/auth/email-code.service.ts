import {
  BadRequestException,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { createHmac, randomInt } from 'crypto';
import type Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from './entities/user.entity';
import type { EmailCodePurpose } from './dto/email-code.dto';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Inject } from '@nestjs/common';

type StoredEmailCode = {
  codeHash: string;
  attempts: number;
  lastSentAt: number; // epoch ms
};

@Injectable()
export class EmailCodeService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
  ) {}

  private get ttlSeconds() {
    return +(process.env.EMAIL_CODE_TTL_SECONDS || 600);
  }
  private get cooldownSeconds() {
    return +(process.env.EMAIL_CODE_COOLDOWN_SECONDS || 60);
  }
  private get maxAttempts() {
    return +(process.env.EMAIL_CODE_MAX_ATTEMPTS || 5);
  }
  private get secret() {
    return process.env.EMAIL_CODE_SECRET || 'email_code_secret_change_me';
  }

  private key(purpose: EmailCodePurpose, email: string) {
    return `email_code:${purpose}:${email.toLowerCase()}`;
  }

  private hash(purpose: EmailCodePurpose, email: string, code: string) {
    return createHmac('sha256', this.secret)
      .update(`${purpose}:${email.toLowerCase()}:${code}`)
      .digest('hex');
  }

  private async getStored(key: string): Promise<StoredEmailCode | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as StoredEmailCode;
      if (!parsed || typeof parsed.codeHash !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private genCode(): string {
    // 6 位数字
    return String(randomInt(100000, 1000000));
  }

  /**
   * 发送验证码（对外层建议统一返回成功，避免枚举）
   * @returns 是否实际发送（例如 register 且邮箱已存在时会返回 false）
   */
  async sendCode(
    email: string,
    purpose: EmailCodePurpose,
  ): Promise<{ sent: boolean; code?: string }> {
    const normalizedEmail = email.toLowerCase();

    // register：若邮箱已存在，直接不发送（但上层应统一返回成功文案）
    if (purpose === 'register') {
      const exists = await this.userRepo.findOne({
        where: { email: normalizedEmail },
      });
      if (exists) return { sent: false };
    }

    // reset_password：若邮箱不存在，直接不发送（仍然统一返回成功）
    if (purpose === 'reset_password') {
      const exists = await this.userRepo.findOne({
        where: { email: normalizedEmail },
      });
      if (!exists) return { sent: false };
    }

    const k = this.key(purpose, normalizedEmail);
    const existing = await this.getStored(k);
    const now = Date.now();
    if (existing && now - existing.lastSentAt < this.cooldownSeconds * 1000) {
      throw new HttpException(
        `请稍后再试（${this.cooldownSeconds}s 内不可重复发送）`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = this.genCode();
    const stored: StoredEmailCode = {
      codeHash: this.hash(purpose, normalizedEmail, code),
      attempts: 0,
      lastSentAt: now,
    };
    await this.redis.set(k, JSON.stringify(stored), 'EX', this.ttlSeconds);
    return { sent: true, code };
  }

  /**
   * 校验并消费验证码（成功后删除）
   */
  async verifyAndConsume(
    email: string,
    purpose: EmailCodePurpose,
    code: string,
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const k = this.key(purpose, normalizedEmail);
    const stored = await this.getStored(k);
    if (!stored) throw new BadRequestException('验证码已过期或不存在');

    const expected = this.hash(purpose, normalizedEmail, code);
    if (stored.codeHash !== expected) {
      const nextAttempts = (stored.attempts || 0) + 1;
      if (nextAttempts >= this.maxAttempts) {
        await this.redis.del(k);
        throw new BadRequestException('验证码错误次数过多，请重新获取');
      }
      const nextStored: StoredEmailCode = { ...stored, attempts: nextAttempts };
      // 保持剩余 TTL
      const ttl = await this.redis.ttl(k);
      if (ttl > 0) {
        await this.redis.set(k, JSON.stringify(nextStored), 'EX', ttl);
      } else {
        await this.redis.set(
          k,
          JSON.stringify(nextStored),
          'EX',
          this.ttlSeconds,
        );
      }
      throw new BadRequestException('验证码错误');
    }

    await this.redis.del(k);
  }
}
