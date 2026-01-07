# Project Milestone Backend

项目后端服务（NestJS + TypeORM + MySQL）。本文档是**项目专属**的运行说明（替换框架模板 README）。

## 技术栈

- **Web**: NestJS（TypeScript）
- **DB**: MySQL
- **ORM**: TypeORM（`synchronize: false`，通过迁移管理表结构）

## 运行前提

- **Node.js**: 建议 20+（与前端保持一致）
- **MySQL**: 建议 8+（或兼容版本）

## 环境变量（`.env`）

本仓库根目录的 `.gitignore` 会忽略任何目录下的 `.env`，所以你在仓库里看不到真实 `.env`，但本地功能正常。

- **获取方式**: 向项目维护者索取 `.env`，或复制 `backend/env.example` 生成自己的 `backend/.env`

关键变量（带默认值的为可选）：

- **PORT**: 后端端口（默认 `3000`）
- **CORS_ORIGIN**: 允许跨域的前端地址（默认 `http://localhost:5173`）
- **DB_HOST**: MySQL Host（默认 `localhost`）
- **DB_PORT**: MySQL Port（默认 `3306`）
- **DB_USER**: MySQL 用户（默认 `root`）
- **DB_PASSWORD**: MySQL 密码（默认 `password`）
- **DB_NAME**: 数据库名（默认 `project_milestone`）
- **JWT_SECRET**: JWT 签名密钥（默认 `changeme`，生产务必修改）
- **SUPER_ADMIN_USERNAME**: 注册时若用户名等于该值，会被标记为超级管理员（可选）
- **EMAIL_SENDER_PROVIDER**: 邮件发送通道：`smtp`（默认）或 `http`（邮件 API/自建中转）
- **DEV_ADMIN_SECRET**: Dev-only 提权接口使用的密钥（可选，但启用接口时必须配置）
- **DEV_SECRET_DEBUG**: `1` 时在非生产环境打印 dev secret 调试信息（默认 `0`）

## 快速开始（Windows / PowerShell）

在仓库根目录执行：

```powershell
cd backend
npm install
Copy-Item env.example .env
npm run start:dev
```

启动后默认：`http://localhost:3000`

## 数据库初始化与迁移

本项目在 `backend/src/typeorm.config.ts` 中配置了 `migrationsRun: true`：**服务启动时会自动执行 `backend/migrations/*.ts` 迁移**。

- **首次新建数据库**：你需要先把基础表建出来（否则部分迁移会依赖 `project/task/user_account` 等表而失败）
  - 推荐执行 SQL 初始化脚本：`backend/migrations/001_init_schema.sql`（或同内容的 `database/migrations/001_init_schema.sql`）

## API 约定（高频）

### 鉴权（JWT）

- **登录**: `POST /auth/login`
- **注册**: `POST /auth/register`
- **当前用户**: `GET /auth/me`

请求头：

- **Authorization**: `Bearer <token>`

### 组织上下文（多租户）

多数业务接口需要组织上下文，额外带：

- **X-Org-Id**: `<orgId>`

后端会校验该用户是否属于组织；若是超级管理员（`isSuperAdmin=true`）则会跳过成员校验。

## Dev-only：提权接口

- `POST /dev/make-super-admin`
  - Header：`X-Dev-Secret: <DEV_ADMIN_SECRET>`
  - Body：`{ "username": "..." }`

注意：仅用于开发/测试环境，生产环境不建议暴露或启用调试输出。
