import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ScheduleRun } from './schedule-run.entity';
import { Task } from '../task/entities/task.entity';

@Entity('schedule_item')
export class ScheduleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ScheduleRun, (run) => run.items)
  scheduleRun: ScheduleRun;

  @ManyToOne(() => Task, (task) => task.scheduleItems)
  task: Task;

  @Column({ type: 'date', nullable: true })
  earlyStart: string;

  @Column({ type: 'date', nullable: true })
  earlyFinish: string;

  @Column({ type: 'date', nullable: true })
  lateStart: string;

  @Column({ type: 'date', nullable: true })
  lateFinish: string;

  @Column('int', { nullable: true })
  slack: number;
}
