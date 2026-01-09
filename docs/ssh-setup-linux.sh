#!/usr/bin/env bash
set -euo pipefail

# 一键配置：Linux 通过 SSH 连接内网 GitLab（192.168.0.109:2222）
#
# 适用：
# - GitLab 内网入口（Web）：https://192.168.0.109:8800/gitlab/
# - GitLab 外网入口（Web）：https://www.zzjovo.com:8853/gitlab/
# - SSH（Git clone/push）：ssh://git@192.168.0.109:2222/<group>/<repo>.git
#
# 用法：
#   chmod +x ./docs/ssh-setup-linux.sh
#   ./docs/ssh-setup-linux.sh
#
# 说明：
# - 生成 ed25519 key：~/.ssh/id_ed25519_zzjovo_gitlab / .pub（如已存在则跳过）
# - 写入 ~/.ssh/config 增加 Host alias：zzjovo-gitlab
# - 打印公钥，提示粘贴到 GitLab：Profile → SSH Keys

GITLAB_HOST="192.168.0.109"
GITLAB_SSH_PORT="2222"
HOST_ALIAS="zzjovo-gitlab"
KEY_NAME="id_ed25519_zzjovo_gitlab"

info() { echo "[INFO] $*"; }
warn() { echo "[WARN] $*" >&2; }
err()  { echo "[ERR ] $*" >&2; }

command -v ssh-keygen >/dev/null 2>&1 || { err "ssh-keygen 未安装"; exit 1; }
command -v ssh >/dev/null 2>&1 || { err "ssh 未安装"; exit 1; }

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

KEY_PATH="$HOME/.ssh/$KEY_NAME"
PUB_PATH="$KEY_PATH.pub"
CFG_PATH="$HOME/.ssh/config"

if [[ ! -f "$KEY_PATH" ]]; then
  info "生成 SSH key: $KEY_PATH"
  ssh-keygen -t ed25519 -C "${USER}@zzjovo-gitlab" -f "$KEY_PATH"
else
  info "SSH key 已存在：$KEY_PATH（跳过生成）"
fi

[[ -f "$PUB_PATH" ]] || { err "未找到公钥文件：$PUB_PATH"; exit 1; }

# 写入 ~/.ssh/config（若不存在 Host alias）
need_append=1
if [[ -f "$CFG_PATH" ]]; then
  if grep -qE "^[[:space:]]*Host[[:space:]]+$HOST_ALIAS([[:space:]]|$)" "$CFG_PATH"; then
    need_append=0
  fi
fi

if [[ "$need_append" -eq 1 ]]; then
  info "写入 SSH config：$CFG_PATH"
  cat >>"$CFG_PATH" <<EOF

Host $HOST_ALIAS
  HostName $GITLAB_HOST
  Port $GITLAB_SSH_PORT
  User git
  IdentityFile ~/.ssh/$KEY_NAME
  IdentitiesOnly yes
EOF
else
  info "SSH config 已包含 Host $HOST_ALIAS（跳过写入）"
fi

chmod 600 "$CFG_PATH" "$KEY_PATH" || true
chmod 644 "$PUB_PATH" || true

echo ""
info "请将下面这一整行公钥复制到 GitLab："
info "内网： https://${GITLAB_HOST}:8800/gitlab/-/profile/keys"
info "外网： https://www.zzjovo.com:8853/gitlab/-/profile/keys"
echo ""
cat "$PUB_PATH"
echo ""

info "粘贴公钥后，测试连通性（首次会写入 known_hosts）："
echo "  ssh -o StrictHostKeyChecking=accept-new -T ${HOST_ALIAS}"
echo ""

info "Git clone 示例："
echo "  git clone ssh://${HOST_ALIAS}/<group>/<repo>.git"
echo ""

