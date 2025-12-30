import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ScheduleRun } from './schedule-run.entity';
import { Task } from '../task/entities/task.entity';

@Entity('schedule_item')
export class ScheduleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ScheduleRun, (run) => run.items)
  @JoinColumn({ name: 'schedule_run_id' })
  scheduleRun: ScheduleRun;

  @ManyToOne(() => Task, (task) => task.scheduleItems)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'early_start', type: 'date', nullable: true })
  earlyStart: string;

  @Column({ name: 'early_finish', type: 'date', nullable: true })
  earlyFinish: string;

  @Column({ name: 'late_start', type: 'date', nullable: true })
  lateStart: string;

  @Column({ name: 'late_finish', type: 'date', nullable: true })
  lateFinish: string;

  @Column('int', { nullable: true })
  slack: number;
}
