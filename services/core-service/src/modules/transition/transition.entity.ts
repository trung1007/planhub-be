import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Workflow } from '../workflow/workflow.entity';
import { Status } from '../status/status.entity';

@Entity('transition')
export class Transition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  workflow_id: number;

  @Column()
  status_id_from: number;

  @Column()
  status_id_to: number;

  @Column({ length: 255 })
  name: string;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Workflow, (wf) => wf.transitions, { onDelete: 'CASCADE' })
  workflow: Workflow;

  @ManyToOne(() => Status, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'status_id_from' })
  from: Status;

  @ManyToOne(() => Status, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'status_id_to' })
  to: Status;
}
