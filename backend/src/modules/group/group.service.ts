import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { OrgMember } from '../org/entities/org-member.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(OrgMember)
    private readonly orgMemberRepo: Repository<OrgMember>,
  ) {}

  async list(orgId: number) {
    return this.groupRepo.find({ where: { orgId }, order: { id: 'ASC' } });
  }

  async create(orgId: number, userId: number, dto: { name: string }, isSuperAdmin = false) {
    if (!isSuperAdmin) {
      const m = await this.orgMemberRepo.findOne({ where: { orgId, userId } });
      if (!m || m.roleInOrg !== 'org_admin') throw new ForbiddenException('需要组织管理员权限');
    }
    return this.groupRepo.save(this.groupRepo.create({ orgId, name: dto.name }));
  }

  async update(orgId: number, userId: number, id: number, dto: { name?: string }, isSuperAdmin = false) {
    if (!isSuperAdmin) {
      const m = await this.orgMemberRepo.findOne({ where: { orgId, userId } });
      if (!m || m.roleInOrg !== 'org_admin') throw new ForbiddenException('需要组织管理员权限');
    }
    const g = await this.groupRepo.findOne({ where: { id, orgId } });
    if (!g) throw new NotFoundException('部门不存在');
    g.name = dto.name ?? g.name;
    return this.groupRepo.save(g);
  }

  async remove(orgId: number, userId: number, id: number, isSuperAdmin = false) {
    if (!isSuperAdmin) {
      const m = await this.orgMemberRepo.findOne({ where: { orgId, userId } });
      if (!m || m.roleInOrg !== 'org_admin') throw new ForbiddenException('需要组织管理员权限');
    }
    await this.groupRepo.delete({ id, orgId });
    // 移除部门时，不强制清空用户 groupId（MVP：留给管理员手动调整）
    return { ok: true };
  }

  async listMembers(orgId: number, groupId: number) {
    const users = await this.orgMemberRepo.find({
      where: { orgId, groupId },
      relations: ['user'],
      order: { id: 'ASC' },
    });
    return users.map((m) => ({
      id: m.userId,
      username: m.user?.username ?? '',
      role: m.roleInGroup,
    }));
  }

  async addMember(orgId: number, actorUserId: number, groupId: number, dto: { userId: number; role: 'admin' | 'member' }, isSuperAdmin = false) {
    if (!isSuperAdmin) {
      const actor = await this.orgMemberRepo.findOne({ where: { orgId, userId: actorUserId } });
      if (!actor || actor.roleInOrg !== 'org_admin') throw new ForbiddenException('需要组织管理员权限');
    }
    const target = await this.orgMemberRepo.findOne({ where: { orgId, userId: dto.userId } });
    if (!target) throw new NotFoundException('目标用户不在该组织');
    target.groupId = groupId;
    target.roleInGroup = dto.role ?? 'member';
    await this.orgMemberRepo.save(target);
    return { ok: true };
  }

  async removeMember(orgId: number, actorUserId: number, groupId: number, userId: number, isSuperAdmin = false) {
    if (!isSuperAdmin) {
      const actor = await this.orgMemberRepo.findOne({ where: { orgId, userId: actorUserId } });
      if (!actor || actor.roleInOrg !== 'org_admin') throw new ForbiddenException('需要组织管理员权限');
    }
    const target = await this.orgMemberRepo.findOne({ where: { orgId, userId } });
    if (!target) throw new NotFoundException('目标用户不在该组织');
    if (target.groupId !== groupId) return { ok: true };
    target.groupId = null;
    target.roleInGroup = 'member';
    await this.orgMemberRepo.save(target);
    return { ok: true };
  }
}


