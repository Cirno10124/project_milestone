import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export type EmailCodePurpose = 'register' | 'reset_password';

export class SendEmailCodeDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsIn(['register', 'reset_password'])
  purpose: EmailCodePurpose;
}

export class VerifyEmailCodeDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsIn(['register', 'reset_password'])
  purpose: EmailCodePurpose;

  @IsString()
  @MinLength(4)
  @MaxLength(12)
  code: string;
}
