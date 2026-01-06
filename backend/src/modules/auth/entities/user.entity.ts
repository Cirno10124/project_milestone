import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_account')
export class UserAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  // 邮箱（与 username 分离；用于验证码注册/找回密码）
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

  @Column({ name: 'email_verified', type: 'tinyint', default: 0 })
  emailVerified: boolean;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  // 超级管理员：可跨组织/跨项目执行所有操作（仅用于测试/运维）
  @Column({ name: 'is_super_admin', type: 'tinyint', default: 0 })
  isSuperAdmin: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
