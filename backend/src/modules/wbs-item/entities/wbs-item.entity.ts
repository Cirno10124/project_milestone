import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Project } from '../../project/entities/project.entity';
import { Task } from '../../task/entities/task.entity';

@Entity('wbs_item')
export class WbsItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id' })
  projectId: number;
  @ManyToOne(() => Project, (project) => project.wbsItems)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: number;
  @ManyToOne(() => WbsItem, (parent) => parent.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
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
