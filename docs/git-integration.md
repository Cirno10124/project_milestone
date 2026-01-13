# Git 联动：提交时自动更新任务进度（项目管理员/成员使用说明）

本功能用于将系统中的“项目/任务”与 GitLab 仓库联动：当仓库发生 **push** 时，系统会解析提交信息（commit message），并自动更新对应任务的 **完成百分比**与**状态**。

---

## 一、角色说明

### 项目管理员（Admin）
- 负责 **绑定仓库**、**启用联动**、**配置 GitLab Webhook**
- 负责告诉团队成员：任务 ID 如何填写到 commit message 里

### 普通成员（Member）
- 在内网时配置 GitLab的SSH密钥，使用外网则无需配置。
- 只需要在提交时按约定写 commit message，即可触发进度自动更新

---

## 二、管理员：启用 Git 联动（绑定仓库 + Webhook）

### 1) 在系统里绑定仓库并启用同步
进入 **项目详情页**（ProjectDetail）后，找到 **“Git 联动”** 区域：

- **仓库地址（URL）**：填写 GitLab 仓库地址（可选，仅用于记录）
- **Git 服务**：选择 GitLab
- **默认分支**：可选（main/master）
- 勾选 **“启用 commit 自动更新任务进度”**
- 点击 **“保存配置”**

保存后页面会展示：
- **Webhook URL**：形如 `https://<你的系统后端域名>/git/webhook/projects/<projectId>`
- **Token**：用于校验 webhook 的安全凭据（请妥善保存）

> 如需更换 token，可点击“轮换 Token”。

### 2) 在 GitLab 配置 Webhook（Push events）
进入 GitLab 仓库：
- Settings → Webhooks

按系统页面提供的信息填写：
- **URL**：复制系统提供的 Webhook URL
- **Secret token**：填写系统提供的 Token（GitLab 会通过请求头 `X-Gitlab-Token` 发送）
- 勾选 **Push events**

保存后建议点击 **Test**（GitLab 自带测试）验证返回 200/ok。

---

## 三、成员：提交时如何触发自动更新进度

系统只在收到 **push webhook** 时处理提交记录，并解析每条 commit 的 message。

### 1) 任务引用（必须）
在 commit message 中引用任务 ID（taskId），支持以下写法：
- `#task:12`
- `task#12`
- `task:12`

> 任务 ID 可在系统的“任务列表”中看到（通常是任务的数字 ID）。

### 2) 更新完成百分比（可选，但推荐）
在同一条 commit message 里追加进度字段：
- `progress:30%`
- `进度:30%`

示例：
- `feat: login #task:12 progress:30%`
- `修复接口校验 task#12 进度:80%`

效果：
- `percentComplete` 会更新为对应数值（0~100）
- 状态会自动推断：
  - 0 → `not_started`
  - 1~99 → `in_progress`
  - 100 → `completed`

### 3) 直接标记完成（可选）
提交信息包含以下关键字之一，会直接将任务置为完成：
- `done`
- `completed`
- `完成`

示例：
- `fix: edge case #task:12 done`
- `任务收尾 task:12 完成`

效果：
- `percentComplete = 100`
- `status = completed`

---

## 四、重要限制与注意事项

- 项目管理员能配置仓库与 webhook；普通成员无需配置。
- 系统只处理 **push 事件**（GitLab Webhook：Push events）。
- 如果项目未勾选 **“启用 commit 自动更新任务进度”**，即使 webhook 正常到达也会被系统忽略。
- 系统会校验 webhook token（`X-Gitlab-Token` / `X-Project-Webhook-Token`），不匹配会拒绝处理。
- 当前只做“任务进度/状态”更新；如果 commit message 里仅写 `#task:<id>` 但不含进度/完成关键词，将不会更新（仅作为引用）。

---

## 五、排错（管理员）

### 1) GitLab 触发了 Webhook，但系统没有更新任务
请按顺序检查：
- **项目是否启用了联动**：项目详情 → Git 联动 → 是否勾选启用
- **Token 是否一致**：GitLab Webhook Secret token 是否与系统提供的 token 一致（必要时轮换后同步修改 GitLab）
- **事件类型**：GitLab Webhook 是否勾选 Push events
- **commit message 是否符合规则**：是否包含 `#task:<id>` 且包含 `progress/进度` 或 `done/完成`

### 2) GitLab 测试 Webhook 失败（4xx/5xx）
常见原因：
- 系统后端地址不可达（网络/反向代理/路径前缀配置不一致）
- Webhook URL 配错（projectId 不对、漏了路径前缀）
- Token 错误

---

## 六、推荐团队约定（建议）

为了减少误差，建议统一格式：

- 进度更新：
  - `#task:<任务ID> progress:<0-100>%`
- 完成：
  - `#task:<任务ID> done`


