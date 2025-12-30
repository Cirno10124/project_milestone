import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { UserAccount } from '../../auth/entities/user.entity';

export type OrgRole = 'org_admin' | 'org_member';
export type DeptRole = 'admin' | 'member';

@Entity('org_member')
@Unique(['orgId', 'userId'])
export class OrgMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'org_id', type: 'bigint' })
  orgId: number;

  @ManyToOne(() => Organization, (o) => o.members)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => UserAccount)
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;

  @Column({ name: 'role_in_org', type: 'enum', enum: ['org_admin', 'org_member'], default: 'org_member' })
  roleInOrg: OrgRole;

  // 单部门归属（在该 org 内）
  @Column({ name: 'group_id', type: 'bigint', nullable: true })
  groupId: number | null;

  @Column({ name: 'role_in_group', type: 'enum', enum: ['admin', 'member'], default: 'member' })
  roleInGroup: DeptRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


