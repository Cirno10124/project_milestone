import { Body, Controller, Headers, Post } from '@nestjs/common';
import { DevService } from './dev.service';

@Controller('dev')
export class DevController {
  constructor(private readonly devService: DevService) {}

  /**
   * Dev-only: 将某个用户提升为超级管理员
   * Header: X-Dev-Secret: <DEV_ADMIN_SECRET>
   * Body: { username: string }
   */
  @Post('make-super-admin')
  makeSuperAdmin(
    @Body() body: { username: string },
    @Headers('x-dev-secret') secret: string | string[] | undefined,
    @Headers() headers: Record<string, unknown>,
  ) {
    // Nest 会把 header 名字转成小写，Postman 传 X-Dev-Secret 这里也能拿到
    // 但为了排查“没收到 header”的情况，允许从 headers 对象兜底再取一次
    const fallback = (headers?.['x-dev-secret'] ?? headers?.['X-Dev-Secret']) as any;
    const raw = secret ?? fallback;
    const s = Array.isArray(raw) ? raw[0] : (raw as string | undefined);

    if (process.env.DEV_SECRET_DEBUG === '1' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[dev-secret] header keys:', Object.keys(headers || {}));
      // eslint-disable-next-line no-console
      console.warn('[dev-secret] raw header value repr:', JSON.stringify(s ?? ''));
    }
    return this.devService.makeSuperAdmin(body.username, s);
  }
}


