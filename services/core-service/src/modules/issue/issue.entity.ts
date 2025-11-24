import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sprint } from '../sprint/sprint.entity';

@Entity({ name: 'issue' })
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sprint_id', type: 'int', nullable: true })
  sprint_id: number | null;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  stage: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resolution: string | null;

  @Column({ name: 'reporter_id', type: 'int', nullable: true })
  reporter_id: number | null;

  @Column({ name: 'assignee_id', type: 'int', nullable: true })
  assignee_id: number | null;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  created_by: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Sprint, (p) => p.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;
}
