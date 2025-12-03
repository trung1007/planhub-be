import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workflow } from '../workflow/workflow.entity';

@Entity('status')
export class Status {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  workflow_id: number;

  @Column({ length: 255 })
  name: string;

  @Column()
  color:string

  @Column({ default: false })
  is_start: boolean;

  @Column({ default: false })
  is_final: boolean;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Workflow, (wf) => wf.statuses, { onDelete: 'CASCADE' })
  workflow: Workflow;
}
