import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestUser } from '../guards/jwt-auth.guard';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest() as any;
  return req.user as RequestUser | undefined;
});


