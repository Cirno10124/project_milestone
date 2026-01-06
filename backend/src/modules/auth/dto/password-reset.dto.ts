import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePasswordResetTokenDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(12)
  code: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(16)
  @MaxLength(200)
  resetToken: string;

  @IsString()
  @MinLength(6)
  @MaxLength(200)
  newPassword: string;
}
