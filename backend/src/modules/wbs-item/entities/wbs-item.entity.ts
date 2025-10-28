import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Project } from '../../project/entities/project.entity';
import { Task } from '../../task/entities/task.entity';

@Entity('wbs_item')
export class WbsItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, (project) => project.wbsItems)
  project: Project;

  @ManyToOne(() => WbsItem, (parent) => parent.children, { nullable: true })
  parent: WbsItem;

  @OneToMany(() => WbsItem, (child) => child.parent)
  children: WbsItem[];

  @Column({ length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('int')
  duration: number;

  @OneToMany(() => Task, (task) => task.wbsItem)
  tasks: Task[];
}
