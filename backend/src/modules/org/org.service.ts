import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { OrgMember } from './entities/org-member.entity';
import { CreateOrgDto } from './dto/create-org.dto';
import { UserAccount } from '../auth/entities/user.entity';

@Injectable()
export class OrgService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(OrgMember)
    private readonly orgMemberRepo: Repository<OrgMember>,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
  ) {}

  async listMyOrgs(userId: number) {
    const items = await this.orgMemberRepo.find({
      where: { userId },
      relations: ['organization'],
      order: { id: 'ASC' },
    });
    return items.map((m) => ({
      id: m.organization?.id ?? m.orgId,
      name: m.organization?.name ?? '',
      roleInOrg: m.roleInOrg,
      groupId: m.groupId ?? null,
      roleInGroup: m.roleInGroup,
    }));
  }

  async createOrg(dto: CreateOrgDto, userId: number) {
    const org = await this.orgRepo.save(this.orgRepo.create({ name: dto.name }));
    await this.orgMemberRepo.save(
      this.orgMemberRepo.create({
        orgId: org.id,
        userId,
        roleInOrg: 'org_admin',
        groupId: null,
        roleInGroup: 'member',
      }),
    );
    return org;
  }

  async getOrg(orgId: number) {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('组织不存在');
    return { id: org.id, name: org.name };
  }

  async listOrgUsers(orgId: number) {
    const members = await this.orgMemberRepo.find({
      where: { orgId },
      relations: ['user'],
      order: { id: 'ASC' },
    });
    return members.map((m) => ({
      id: m.user?.id ?? m.userId,
      username: m.user?.username ?? '',
      roleInOrg: m.roleInOrg,
      groupId: m.groupId ?? null,
      roleInGroup: m.roleInGroup,
    }));
  }

  async ensureOrgAdmin(orgId: number, userId: number, isSuperAdmin = false) {
    if (isSuperAdmin) return { ok: true };
    const m = await this.orgMemberRepo.findOne({ where: { orgId, userId } });
    if (!m) throw new ForbiddenException('不属于该组织');
    if (m.roleInOrg !== 'org_admin') throw new ForbiddenException('需要组织管理员权限');
    return m;
  }

  async setUserGroup(
    orgId: number,
    actorUserId: number,
    targetUserId: number,
    groupId: number | null,
    roleInGroup: 'admin' | 'member',
    isSuperAdmin = false,
  ) {
    await this.ensureOrgAdmin(orgId, actorUserId, isSuperAdmin);
    const m = await this.orgMemberRepo.findOne({ where: { orgId, userId: targetUserId } });
    if (!m) throw new NotFoundException('用户不在该组织');
    m.groupId = groupId;
    m.roleInGroup = roleInGroup;
    await this.orgMemberRepo.save(m);
    return { ok: true };
  }

  async addUserToOrg(orgId: number, actorUserId: number, username: string, isSuperAdmin = false) {
    await this.ensureOrgAdmin(orgId, actorUserId, isSuperAdmin);
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) throw new NotFoundException('用户不存在');
    const exists = await this.orgMemberRepo.findOne({ where: { orgId, userId: user.id } });
    if (exists) return { ok: true };
    await this.orgMemberRepo.save(this.orgMemberRepo.create({ orgId, userId: user.id, roleInOrg: 'org_member', groupId: null, roleInGroup: 'member' }));
    return { ok: true };
  }
}


