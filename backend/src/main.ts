import { NestFactory } from '@nestjs/core';
import dotenv from 'dotenv';
import { AppModule } from './app.module';

// 加载 .env 配置
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 启用 CORS，允许前端跨域
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
