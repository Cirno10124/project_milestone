export class ComputeScoreDto {
  projectId: number;
  moduleCompleteness: number; // 0-25
  e2eAvailability: number; // 0-25
  milestonePercent: number; // 完成度百分比，用于计算里程碑分
  difficulty: 'E' | 'N' | 'H' | 'L';
  actualDeliveryDays: number; // 实际交付天数
  baselineDays: number; // 计划+容错天数
  earlyDeliveryDays?: number; // 提前交付天数
  algorithmQuality: number; // 0-5
  architectureQuality: number; // 0-10
  codeStyle: number; // 0-5
  securityScanScore: number; // 漏洞扫描和测试覆盖度比例(0-100)
  e2eSecurityTestScore: number; // 安全测试用例得分比例(0-100)
  authSessionScore: number; // 认证授权测试比例(0-100)
  configHardeningScore: number; // 安全配置加固比例(0-100)
}

