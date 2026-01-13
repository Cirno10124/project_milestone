import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CiReportDto {
  @IsIn(['success', 'failed', 'canceled', 'running', 'pending'])
  status: 'success' | 'failed' | 'canceled' | 'running' | 'pending';

  @IsString()
  @MaxLength(255)
  projectPath: string;

  @IsString()
  @MaxLength(255)
  ref: string;

  @IsString()
  @MaxLength(64)
  sha: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  // 提交者邮箱（CI 侧上报）
  @IsString()
  @MaxLength(255)
  userEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  userName?: string;

  // CI 失败时可附带错误日志（建议截断）
  @IsOptional()
  @IsString()
  @MaxLength(12000)
  errorLog?: string;
}

