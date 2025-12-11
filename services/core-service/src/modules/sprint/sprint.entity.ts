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
import { Release } from '../release/release.entity';
import { Issue } from '../issue/issue.entity';

@Entity('sprint')
export class Sprint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  project_id: number;

  @Column()
  release_id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50 })
  key: string;

  @Column()
  is_active:boolean;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ============= Relations =============

  @ManyToOne(() => Release, (r) => r.sprints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'release_id' })
  release: Release;

  @OneToMany(() => Issue, (s) => s.sprint, {
    cascade: true,
  })
  issues: Issue[];

  // Bạn sẽ thêm quan hệ khác sau (task, issue, member...)
}
