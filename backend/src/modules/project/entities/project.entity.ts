import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { WbsItem } from '../../wbs-item/entities/wbs-item.entity';

@Entity('project')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @OneToMany(() => WbsItem, (item) => item.project)
  wbsItems: WbsItem[];
}
