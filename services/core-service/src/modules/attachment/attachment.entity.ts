import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Issue } from '../issue/issue.entity';

@Entity({ name: 'attachment' })
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issue_id', type: 'int' })
  issue_id: number;

  @Column({ type: 'varchar', length: 255 })
  file_name: string; // Lưu tên file

  @Column({ type: 'bytea' })
  file_data: Buffer; // Lưu trữ dữ liệu file nhị phân


  @Column({ type: 'varchar', length: 255, nullable: true })
  mime_type: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Issue, (i) => i.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;
}
