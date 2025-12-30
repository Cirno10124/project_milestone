import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Project } from './project.entity';
import { UserAccount } from '../../auth/entities/user.entity';

export type ProjectRole = 'admin' | 'member';

@Entity('project_member')
@Unique(['projectId', 'userId'])
export class ProjectMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'bigint' })
  projectId: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => UserAccount)
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;

  @Column({ type: 'enum', enum: ['admin', 'member'], default: 'member' })
  role: ProjectRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


