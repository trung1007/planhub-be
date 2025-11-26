import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Sprint } from '../sprint/sprint.entity';
import { Attachment } from '../attachment/attachment.entity';
import { Comment } from '../comment/comment.entity';
import { IssueStatus } from 'src/enum/issue-status.enum';
import { IssuePriority } from 'src/enum/issue-priority.enum';
import { TagEnum } from 'src/enum/issue-tag.enum';
import { IssueType } from 'src/enum/issu-type.enum';

@Entity({ name: 'issue' })
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sprint_id', type: 'int', nullable: true })
  sprint_id: number | null;

  @Column({
    type: 'enum',
    enum: IssueType,
    nullable: true,
  })
  type: IssueType | null;

  // 🔥 NEW: issue cha (nếu là sub-task)
  @Column({ name: 'parent_issue_id', type: 'int', nullable: true })
  parent_issue_id: number | null;

  // issue con -> issue cha
  @ManyToOne(() => Issue, (issue) => issue.subtasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_issue_id' })
  parent: Issue | null;

  // issue cha -> danh sách sub-task
  @OneToMany(() => Issue, (issue) => issue.parent)
  subtasks: Issue[];

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: TagEnum,
    array: true,
    nullable: true,
  })
  tags: TagEnum[] | null;

  @Column({
    type: 'enum',
    enum: IssueStatus,
    nullable: true,
  })
  status: IssueStatus | null;

  @Column({
    type: 'enum',
    enum: IssuePriority,
    nullable: true,
  })
  priority: IssuePriority | null;

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

  @OneToMany(() => Attachment, (a) => a.issue)
  attachments: Attachment[];

  @OneToMany(() => Comment, (c) => c.issue)
  comments: Comment[];
}
