import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import dotenv from 'dotenv';
import { AppModule } from './app.module';

// 加载 .env 配置
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 启用 DTO 校验（class-validator）与自动类型转换
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // 注意：仓库内大量 DTO 未加 class-validator 装饰器。
      // 若开启 whitelist/forbidNonWhitelisted 会导致请求体字段被剥离、破坏现有接口。
      // 当前仅对“有装饰器”的 DTO 生效校验。
    }),
  );
  // 启用 CORS，允许前端跨域
  // 支持逗号分隔的多 Origin（例如：http://localhost:5173,http://192.168.0.109:5173）
  const corsOriginsRaw = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const corsOrigins = new Set<string>(
    corsOriginsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const corsAllowAll = corsOrigins.has('*');
  if (process.env.NODE_ENV === 'production' && corsAllowAll) {
    // credentials=true 时反射 Origin 等同于“允许所有来源携带 Cookie/凭证访问”，生产环境风险极高
    throw new Error('CORS_ORIGIN must not be * in production when credentials are enabled');
  }
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // 非浏览器场景（如 curl/Postman/服务器间调用）可能不带 Origin，直接放行
      if (!origin) return callback(null, true);
      // 开发兜底：CORS_ORIGIN=* 表示允许所有来源（生产环境不建议）
      if (corsAllowAll) return callback(null, true);
      if (corsOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
