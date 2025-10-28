import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { WbsItem } from '../../wbs-item/entities/wbs-item.entity';
import { Dependency } from '../../dependency/dependency.entity';
import { ScheduleItem } from '../../schedule/schedule-item.entity';

@Entity('task')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WbsItem, (item) => item.tasks)
  wbsItem: WbsItem;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column('int', { nullable: true })
  duration: number;

  @Column({ type: 'enum', enum: ['not_started','in_progress','completed','on_hold'], default: 'not_started' })
  status: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  percentComplete: number;

  @OneToMany(() => Dependency, (dep) => dep.task)
  predecessors: Dependency[];

  @OneToMany(() => Dependency, (dep) => dep.predecessor)
  successors: Dependency[];

  @OneToMany(() => ScheduleItem, (item) => item.task)
  scheduleItems: ScheduleItem[];
}
