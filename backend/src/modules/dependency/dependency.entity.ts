import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Task } from '../task/entities/task.entity';

@Entity('dependency')
export class Dependency {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Task, (task) => task.successors)
  task: Task;

  @ManyToOne(() => Task, (task) => task.predecessors)
  predecessor: Task;

  @Column({ type: 'enum', enum: ['FS','SS','FF','SF'], default: 'FS' })
  type: string;

  @Column('int', { default: 0 })
  lag: number;
}
