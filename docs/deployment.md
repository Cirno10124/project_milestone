# 部署与使用说明（GitLab / Runner / 系统联动）

本文档面向运维/管理员，说明在当前网络约束下如何部署 GitLab、Runner 以及与本系统联动的关键配置，并给出日常使用方式与常见问题排查点。

---

## 1. 部署目标与入口约定

### 1.1 总体结构（同机部署）

- **同一台 Ubuntu 服务器**上部署：
  - GitLab（Docker Omnibus）
  - GitLab Runner（Docker）
  - 本系统后端（NestJS，假设本机 `3000`）
  - Nginx（反向代理/路径分流）

### 1.2 端口/入口约定（已验证）

- **外网 GitLab（经网关）**：`https://www.zzjovo.com:8853/gitlab/`
- **内网 GitLab（直连内网 IP）**：`https://192.168.0.109:8800/gitlab/`
- **Git over SSH（内网）**：`ssh://git@192.168.0.109:2222/<group>/<repo>.git`
- **系统后端（示例，按你们 nginx 配置）**：
  - 外网：`https://www.zzjovo.com:8853/pm/`
  - 内网：`https://192.168.0.109:8800/pm/`

> 说明：GitLab 采用 **子路径（relative_url_root）** 模式部署在 `/gitlab` 下。

---

## 2. GitLab（Docker Omnibus）部署要点

### 2.1 关键配置项

在 `docker-compose.yml` 的 `GITLAB_OMNIBUS_CONFIG` 中至少需要：

- `external_url 'https://www.zzjovo.com:8853/gitlab'`
- `gitlab_rails['gitlab_relative_url_root'] = '/gitlab'`
- GitLab 容器内部 Nginx 监听本机端口（示例 `8081`），由系统 Nginx 反代进来

外部 SSH 端口（内网）按约定映射为：
- 宿主机 `2222` → 容器 `22`

### 2.2 使配置生效

修改配置后，执行：

```bash
cd /srv/stack
sudo docker compose up -d
sudo docker exec -it gitlab gitlab-ctl reconfigure
```

### 2.3 初始 root 密码

首次启动后 24h 内可通过：

```bash
sudo docker exec -it gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

---

## 3. Nginx：路径分流与转发头（关键）

### 3.1 必须定义 map（用于 websocket/upgrade）

在 `/etc/nginx/nginx.conf` 的 `http {}` 作用域中加入：

```nginx
map $http_upgrade $connection_upgrade {
  default upgrade;
  '' close;
}
```

### 3.2 常见坑

- **CSRF 422**：GitLab 的 `external_url` 为 https 时，GitLab 会设置 **Secure cookie**。因此“内网入口”必须也使用 **https**，不能用纯 http 访问登录/注册页，否则会出现：
  - `Can't verify CSRF token authenticity`
- **重定向丢端口**：若入口是非标准端口（如 8853），需要确保：
  - 反代给 GitLab 时传正确的 `Host/X-Forwarded-Host`（建议用 `$http_host` 或直接写死 `www.zzjovo.com:8853`）
  - 传正确的 `X-Forwarded-Port`
- **/gitlab → /gitlab/**：建议用绝对跳转（带端口）避免端口丢失：
  - `return 301 https://www.zzjovo.com:8853/gitlab/;`

---

## 4. GitLab Runner（Docker）部署与注册

### 4.1 Runner 容器

Runner 容器需挂载：
- `/var/run/docker.sock:/var/run/docker.sock`
- `/srv/gitlab-runner/config:/etc/gitlab-runner`

### 4.2 注册 Runner

在 GitLab UI 获取 registration token 后（Admin/Group/Project 的 Runners 页面），执行：

```bash
sudo docker exec -it gitlab-runner gitlab-runner register \
  --non-interactive \
  --url "https://www.zzjovo.com:8853/gitlab" \
  --registration-token "替换成你的TOKEN" \
  --executor "docker" \
  --docker-image "node:20" \
  --description "runner-zzjovo-01" \
  --tag-list "docker,ci" \
  --run-untagged="true" \
  --locked="false"
```

验证：

```bash
sudo docker exec -it gitlab-runner gitlab-runner verify
```

### 4.3 Runner 配置存放位置

注册成功后，Runner token 会写入：
- 宿主机：`/srv/gitlab-runner/config/config.toml`

---

## 5. CI 使用方式（本仓库示例）

仓库根目录 `.gitlab-ci.yml` 已包含：
- 前端（Vue/Vite）测试与构建
- 后端（NestJS）测试与构建
- Python / C++ 的可选 job（仓库出现对应特征文件才会启用）

如需“全项目默认上传即跑 CI”，推荐使用 **模板仓库 + include** 的方式（见 `README.md` 的说明）。

---

## 6. 系统与 GitLab 联动（Webhook）

本系统支持 GitLab Push Webhook：在 push/commit 时按 commit message 规则自动更新任务进度。

- 使用说明：见 `docs/git-integration.md`
- 开发者 SSH 一键配置脚本：
  - Windows：`docs/ssh-setup-windows.ps1`
  - Linux：`docs/ssh-setup-linux.sh`

---

## 7. 常见问题排查

### 7.1 GitLab 页面能打开但注册/登录 422
- 检查内网入口是否为 **https**
- 检查 `X-Forwarded-Proto` 是否为 `https`

### 7.2 /gitlab 访问跳转不带端口
- 检查 Nginx 是否传了正确的 `Host/X-Forwarded-Host`（建议 `$http_host` 或直接写死 `www.zzjovo.com:8853`）
- 检查 `X-Forwarded-Port` 是否为 `8853`
- 检查 `/gitlab` 是否用绝对跳转到 `...:8853/gitlab/`

### 7.3 SSH 推送报 publickey denied
- 说明网络通但 key 未配置：
  - Windows/Linux 执行一键脚本生成 key
  - 把 **公钥**粘贴到 GitLab：Profile → SSH Keys

