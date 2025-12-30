import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrgMember } from '../../modules/org/entities/org-member.entity';

export type OrgContext = {
  orgId: number;
  orgRole: 'org_admin' | 'org_member';
  groupId: number | null;
  groupRole: 'admin' | 'member';
};

@Injectable()
export class OrgGuard implements CanActivate {
  constructor(
    @InjectRepository(OrgMember)
    private readonly orgMemberRepo: Repository<OrgMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest() as any;
    const raw = (req?.headers?.['x-org-id'] ?? req?.headers?.['X-Org-Id']) as string | undefined;
    if (!raw) throw new BadRequestException('缺少 X-Org-Id');
    const orgId = Number(raw);
    if (!Number.isFinite(orgId) || orgId <= 0) throw new BadRequestException('非法 X-Org-Id');
    const userId: number | undefined = req?.user?.id;
    if (!userId) throw new ForbiddenException();
    if (req?.user?.isSuperAdmin) {
      req.org = {
        orgId,
        orgRole: 'org_admin',
        groupId: null,
        groupRole: 'admin',
      } satisfies OrgContext;
      return true;
    }

    const member = await this.orgMemberRepo.findOne({ where: { orgId, userId } });
    if (!member) throw new ForbiddenException('不属于该组织');

    req.org = {
      orgId,
      orgRole: member.roleInOrg,
      groupId: member.groupId ?? null,
      groupRole: member.roleInGroup,
    } satisfies OrgContext;
    return true;
  }
}


