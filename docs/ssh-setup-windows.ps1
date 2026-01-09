<# 
  一键配置：Windows 通过 SSH 连接内网 GitLab（192.168.0.109:2222）

  适用：
  - GitLab 内网入口（Web）：https://192.168.0.109:8800/gitlab/
  - GitLab 外网入口（Web）：https://www.zzjovo.com:8853/gitlab/
  - SSH（Git clone/push）：ssh://git@192.168.0.109:2222/<group>/<repo>.git

  用法（PowerShell）：
    Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
    .\ssh-setup-windows.ps1

  说明：
  - 会在 ~/.ssh/ 生成一对 ed25519 key：id_ed25519_zzjovo_gitlab / .pub
  - 会写入 ~/.ssh/config 增加 Host alias：zzjovo-gitlab
  - 需要你把公钥粘贴到 GitLab：Profile → SSH Keys
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$GitlabHost = "192.168.0.109"
$GitlabSshPort = 2222
$HostAlias = "zzjovo-gitlab"
$KeyName = "id_ed25519_zzjovo_gitlab"

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ERR ] $msg" -ForegroundColor Red }

if (-not (Get-Command ssh-keygen -ErrorAction SilentlyContinue)) {
  Write-Err "未找到 ssh-keygen。请安装 OpenSSH Client（Windows 可选功能）后重试。"
  exit 1
}

$sshDir = Join-Path $env:USERPROFILE ".ssh"
$keyPath = Join-Path $sshDir $KeyName
$pubPath = "$keyPath.pub"
$cfgPath = Join-Path $sshDir "config"

New-Item -ItemType Directory -Path $sshDir -Force | Out-Null

if (-not (Test-Path $keyPath)) {
  Write-Info "生成 SSH key: $keyPath"
  & ssh-keygen -t ed25519 -C "$env:USERNAME@zzjovo-gitlab" -f $keyPath
} else {
  Write-Info "SSH key 已存在：$keyPath（跳过生成）"
}

if (-not (Test-Path $pubPath)) {
  Write-Err "未找到公钥文件：$pubPath"
  exit 1
}

# 写入 ~/.ssh/config（若不存在 Host alias）
$needAppend = $true
if (Test-Path $cfgPath) {
  $cfg = Get-Content -Raw -Path $cfgPath
  if ($cfg -match "(?m)^\s*Host\s+$HostAlias\s*$") {
    $needAppend = $false
  }
}

if ($needAppend) {
  Write-Info "写入 SSH config：$cfgPath"
  $block = @"

Host $HostAlias
  HostName $GitlabHost
  Port $GitlabSshPort
  User git
  IdentityFile ~/.ssh/$KeyName
  IdentitiesOnly yes
"@ | Out-File -FilePath $cfgPath -Encoding utf8 -Append

  # 注意：OpenSSH for Windows 不接受 UTF-8 BOM；用无 BOM 的 UTF-8 追加写入
  $encNoBom = New-Object System.Text.UTF8Encoding($false)
  if (Test-Path $cfgPath) {
    $existing = [System.IO.File]::ReadAllText($cfgPath, $encNoBom)
    if (-not $existing.EndsWith("`r`n")) { $existing += "`r`n" }
    [System.IO.File]::WriteAllText($cfgPath, $existing + $block, $encNoBom)
  } else {
    [System.IO.File]::WriteAllText($cfgPath, $block, $encNoBom)
  }
} else {
  Write-Info "SSH config 已包含 Host $HostAlias（跳过写入）"
}

Write-Host ""
Write-Info "请将下面这一整行公钥复制到 GitLab："
Write-Info "内网： https://$GitlabHost:8800/gitlab/-/profile/keys"
Write-Info "外网： https://www.zzjovo.com:8853/gitlab/-/profile/keys"
Write-Host ""
Get-Content -Path $pubPath
Write-Host ""

Write-Info "粘贴公钥后，执行以下命令测试连通性（首次会提示保存主机指纹）："
Write-Host "  ssh -o StrictHostKeyChecking=accept-new -T $HostAlias" -ForegroundColor Green
Write-Host ""

Write-Info "Git clone 示例："
Write-Host "  git clone ssh://$HostAlias/<group>/<repo>.git" -ForegroundColor Green
Write-Host ""

