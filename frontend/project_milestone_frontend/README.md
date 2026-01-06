# Project Milestone Frontend

项目前端（Vue 3 + Vite + Pinia + Vue Router）。本文档是**项目专属**的运行说明（替换框架模板 README）。

## 技术栈

- **Vue**: Vue 3
- **Build**: Vite
- **State**: Pinia
- **Router**: vue-router
- **HTTP**: axios（见 `src/utils/http.ts`）

## 环境变量（`.env`）

仓库根目录 `.gitignore` 会忽略任何目录下的 `.env`，所以你在仓库里看不到真实 `.env`，但本地功能正常。

- **获取方式**: 向项目维护者索取 `.env`，或复制 `frontend/project_milestone_frontend/env.example` 生成自己的 `frontend/project_milestone_frontend/.env`

关键变量：

- **VITE_API_URL**: 后端 API 基地址（默认 `http://localhost:3000`）。若你用局域网 IP 打开前端（例如 `http://192.168.0.109:5173`），请把它改成 `http://192.168.0.109:3000`

## 快速开始（Windows / PowerShell）

在仓库根目录执行：

```powershell
cd frontend\project_milestone_frontend
npm install
Copy-Item env.example .env
npm run dev
```

默认开发地址：`http://localhost:5173`

## 与后端的对接约定（高频）

- **Authorization**: 前端会把 `localStorage.token` 作为 `Bearer <token>` 放到请求头（见 `src/utils/http.ts`）
- **X-Org-Id**: 若已选择组织，前端会把 `currentOrgId` 放到请求头（见 `src/utils/http.ts`）
- **后端跨域**: 后端用 `CORS_ORIGIN` 控制允许的前端来源，支持逗号分隔多个 Origin（例如 `http://localhost:5173,http://192.168.0.109:5173`）

## 常用脚本

```sh
npm run dev
npm run build
npm run preview
npm run lint
```
