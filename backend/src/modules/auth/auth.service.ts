import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { username: dto.username } });
    if (exists) throw new ConflictException('用户名已存在');
    const hash = await bcrypt.hash(dto.password, 10);
    const isSuper = process.env.SUPER_ADMIN_USERNAME && process.env.SUPER_ADMIN_USERNAME === dto.username;
    const user = this.userRepo.create({ username: dto.username, passwordHash: hash, isSuperAdmin: !!isSuper });
    return this.userRepo.save(user);
  }

  async login(dto: RegisterDto) {
    const user = await this.userRepo.findOne({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedException('用户名或密码错误');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('用户名或密码错误');
    const payload = { sub: user.id, username: user.username, isSuperAdmin: !!user.isSuperAdmin };
    return { token: this.jwtService.sign(payload) };
  }

  verifyToken(token: string): { sub: number; username: string; isSuperAdmin?: boolean } {
    return this.jwtService.verify(token) as { sub: number; username: string; isSuperAdmin?: boolean };
  }

  /**
   * 根据 JWT Token 返回当前用户信息
   */
  async getProfile(token: string) {
    try {
      const payload = this.verifyToken(token);
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return { id: user.id, username: user.username, isSuperAdmin: !!user.isSuperAdmin };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
