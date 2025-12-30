import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { Project } from '../project/entities/project.entity';
import { ScheduleItem } from './schedule-item.entity';

@Entity('schedule_run')
export class ScheduleRun {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'run_type', type: 'enum', enum: ['initial','rolling'], default: 'initial' })
  runType: string;

  @CreateDateColumn({ name: 'executed_at' })
  executedAt: Date;

  @OneToMany(() => ScheduleItem, (item) => item.scheduleRun)
  items: ScheduleItem[];
}



