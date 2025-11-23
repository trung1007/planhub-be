import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Release } from '../release/release.entity';

@Entity('sprint')
export class Sprint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  release_id: number;

  @Column({ length: 255 })
  name: string;

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
  release: Release;

  // Bạn sẽ thêm quan hệ khác sau (task, issue, member...)
}
