import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Project } from '../project/entities/project.entity';
import { ScheduleItem } from './schedule-item.entity';

@Entity('schedule_run')
export class ScheduleRun {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project)
  project: Project;

  @Column({ type: 'enum', enum: ['initial','rolling'], default: 'initial' })
  runType: string;

  @CreateDateColumn()
  executedAt: Date;

  @OneToMany(() => ScheduleItem, (item) => item.scheduleRun)
  items: ScheduleItem[];
}



