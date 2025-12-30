import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';

export type RequestUser = { id: number; username: string; isSuperAdmin: boolean };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest() as any;
    const authHeader: string | undefined = req?.headers?.authorization;
    if (!authHeader) throw new UnauthorizedException();
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new UnauthorizedException();
    try {
      const payload = this.authService.verifyToken(token);
      req.user = { id: payload.sub, username: payload.username, isSuperAdmin: !!payload.isSuperAdmin } satisfies RequestUser;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}


