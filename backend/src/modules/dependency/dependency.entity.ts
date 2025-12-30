import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Task } from '../task/entities/task.entity';

@Entity('dependency')
export class Dependency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'task_id', type: 'bigint' })
  taskId: number;
  @ManyToOne(() => Task, (task) => task.successors)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'predecessor_id', type: 'bigint' })
  predecessorId: number;
  @ManyToOne(() => Task, (task) => task.predecessors)
  @JoinColumn({ name: 'predecessor_id' })
  predecessor: Task;

  @Column({ type: 'enum', enum: ['FS','SS','FF','SF'], default: 'FS' })
  type: string;

  @Column('int', { name: 'lag', default: 0, comment: '滞后天数' })
  lag: number;
}
