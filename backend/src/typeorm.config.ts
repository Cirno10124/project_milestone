import dotenv from 'dotenv';
// 加载 .env 配置
dotenv.config();
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const dbPassword = process.env.DB_PASSWORD || 'password';
if (process.env.NODE_ENV === 'production' && dbPassword === 'password') {
  throw new Error('DB_PASSWORD must be set to a non-default value in production');
}

const isProduction = process.env.NODE_ENV === 'production';
const databaseName = isProduction
  ? process.env.DB_NAME_PROD || process.env.DB_NAME || 'project_milestone'
  : process.env.DB_NAME || 'project_milestone';
const migrationsPath = isProduction
  ? __dirname + '/migrations/*.js'
  : __dirname + '/../migrations/*{.ts,.js}';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || 'root',
  password: dbPassword,
  database: databaseName,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [migrationsPath],
  // 关闭自动同步，使用迁移管理表结构变更
  synchronize: false,
  migrationsRun: true,
};
