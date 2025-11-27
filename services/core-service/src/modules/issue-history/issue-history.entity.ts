import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum HistoryEntity {
  ISSUE = 'issue',
  COMMENT = 'comment',
  ATTACHMENT = 'attachment',
}

export enum HistoryAction {
  // Issue
  ISSUE_CREATE = 'issue_create',
  ISSUE_UPDATE = 'issue_update',
  ISSUE_DELETE = 'issue_delete',

  // Comment
  COMMENT_ADD = 'comment_add',
  COMMENT_EDIT = 'comment_edit',
  COMMENT_DELETE = 'comment_delete',

  // Attachment
  ATTACHMENT_ADD = 'attachment_add',
  ATTACHMENT_DELETE = 'attachment_delete',
}

@Entity({ name: 'issue_history' })
export class IssueHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issue_id', type: 'int' })
  issue_id: number;

  /** Loại entity bị tác động (issue/comment/attachment) */
  @Column({
    type: 'enum',
    enum: HistoryEntity,
  })
  entity: HistoryEntity;

  /** ID của entity diễn ra thay đổi (comment_id hoặc attachment_id hoặc issue_id) */
  @Column({ name: 'entity_id', type: 'int', nullable: true })
  entity_id: number | null;

  @Column({
    type: 'enum',
    enum: HistoryAction,
  })
  action: HistoryAction;

  /** Tên field nếu là ISSUE_UPDATE */
  @Column({ type: 'varchar', length: 100, nullable: true })
  field: string | null;

  /** Value thay đổi của Issue field */
  @Column({ type: 'text', nullable: true })
  old_value: string | null;

  @Column({ type: 'text', nullable: true })
  new_value: string | null;


  @Column({ type: 'jsonb', nullable: true })
  metadata: any | null;

  /** Ai thay đổi (userId từ user-service) */
  @Column({ name: 'changed_by', type: 'int', nullable: true })
  changed_by: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;
}
