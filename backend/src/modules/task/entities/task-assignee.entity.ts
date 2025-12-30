import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Task } from './task.entity';
import { UserAccount } from '../../auth/entities/user.entity';

@Entity('task_assignee')
@Unique(['taskId', 'userId'])
export class TaskAssignee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'task_id', type: 'bigint' })
  taskId: number;

  @ManyToOne(() => Task, (t) => t.assignees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => UserAccount)
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;

  @Column({ name: 'assigned_by', type: 'bigint', nullable: true })
  assignedBy: number | null;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;
}


