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
import { Sprint } from '../sprint/sprint.entity';
import { ReleaseStatus } from '../../enum/release-status.enum';

@Entity('release')
export class Release {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  project_id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  version: string;

  @Column({
    name: 'statis',
    type: 'enum',
    enum: ReleaseStatus,
    default: ReleaseStatus.PLANNED,
  })
  status: ReleaseStatus;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ============= Relations =============
  @ManyToOne(() => Project, (p) => p.releases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => Sprint, (s) => s.release, {
    cascade: true,
  })
  sprints: Sprint[];

  // Chờ bạn bổ sung quan hệ khác (task? sprint?)
}
