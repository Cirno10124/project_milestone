import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMyNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  ciNotifyEnabled?: boolean;
}

