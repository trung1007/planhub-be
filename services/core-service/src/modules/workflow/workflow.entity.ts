import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { Status } from '../status/status.entity';
import { Transition } from '../transition/transition.entity';

@Entity('workflow')
export class Workflow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  project_id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  key: string;

  @Column({ length: 50 })
  version: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  created_by: number;

  @Column()
  updated_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ============= Relations =============
  @ManyToOne(() => Project, (p) => p.workflows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => Status, (s) => s.workflow, {
    cascade: true,
  })
  statuses: Status[];

  @OneToMany(() => Transition, (s) => s.workflow, {
    cascade: true,
  })
  transitions: Transition[];

  // Chờ bạn bổ sung quan hệ (workflow steps? workflow transitions?)
}
