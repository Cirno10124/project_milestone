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
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
