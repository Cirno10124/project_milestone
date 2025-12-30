import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
  
  /**
   * 获取当前用户信息
   */
  @Get('me')
  async getMe(@Headers('authorization') authHeader: string) {
    if (!authHeader) throw new UnauthorizedException();
    const token = authHeader.replace(/^Bearer\s+/i, '');
    return this.authService.getProfile(token);
  }
}
