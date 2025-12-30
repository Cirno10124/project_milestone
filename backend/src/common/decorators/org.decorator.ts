import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { OrgContext } from '../guards/org.guard';

export const Org = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest() as any;
  return req.org as OrgContext | undefined;
});


