import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Project } from '../project/project.entity';

@Entity('project_member')
@Unique(['project_id', 'user_id', 'role_id']) 
export class ProjectMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  project_id: number;

  @Column()
  user_id: number;

  @Column()
  role_id: number;

  @Column()
  created_by: number;

  @Column()
  join_date:Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ============= Relations =============

  @ManyToOne(() => Project, (p) => p.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "project_id" }) 
  project: Project;

}
