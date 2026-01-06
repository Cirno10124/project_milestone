import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  username: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(200)
  password: string;

  // 邮箱验证码（注册用途）——后续在 AuthService.register 中强校验
  @IsString()
  @MinLength(4)
  @MaxLength(12)
  code: string;
}
