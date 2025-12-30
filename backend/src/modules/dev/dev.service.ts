import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from '../auth/entities/user.entity';

@Injectable()
export class DevService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
  ) {}

  private assertDevEnabled() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('dev 接口在生产环境不可用');
    }
  }

  private assertSecret(secret: string | undefined) {
    const expected = (process.env.DEV_ADMIN_SECRET || '').trim();
    const provided = (secret || '').trim();
    if (!expected) throw new ForbiddenException('未配置 DEV_ADMIN_SECRET');
    if (!provided || provided !== expected) {
      // Dev-only 调试：通过 JSON.stringify 暴露不可见字符（空格/换行/制表符等）
      // 默认不打印明文，只有显式开启 DEV_SECRET_DEBUG=1 才打印
      if (process.env.NODE_ENV !== 'production') {
        const debug = process.env.DEV_SECRET_DEBUG === '1';
        const base = `[dev-secret] mismatch expectedLen=${expected.length} providedLen=${provided.length} expectedRepr=${JSON.stringify(expected)} providedRepr=${JSON.stringify(provided)}`;
        if (debug) {
          // 明文打印（仅用于本地排查）
          // eslint-disable-next-line no-console
          console.warn(base + ` expected=${expected} provided=${provided}`);
        } else {
          // eslint-disable-next-line no-console
          console.warn(base + ' (set DEV_SECRET_DEBUG=1 to print raw values)');
        }
      }
      throw new ForbiddenException('无效 dev secret');
    }
  }

  async makeSuperAdmin(username: string, secret: string | undefined) {
    this.assertDevEnabled();
    this.assertSecret(secret);
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) throw new NotFoundException('用户不存在');
    user.isSuperAdmin = true;
    await this.userRepo.save(user);
    return { ok: true };
  }
}


