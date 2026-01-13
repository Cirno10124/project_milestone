import dotenv from 'dotenv';
// 加载 .env 配置
dotenv.config();
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const dbPassword = process.env.DB_PASSWORD || 'password';
if (process.env.NODE_ENV === 'production' && dbPassword === 'password') {
  throw new Error('DB_PASSWORD must be set to a non-default value in production');
}

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || 'root',
  password: dbPassword,
  database: process.env.DB_NAME || 'project_milestone',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  // 关闭自动同步，使用迁移管理表结构变更
  synchronize: false,
  migrationsRun: true,
};
