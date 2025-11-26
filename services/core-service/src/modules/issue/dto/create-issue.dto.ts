import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import { IssueType } from 'src/enum/issu-type.enum';
import { IssuePriority } from 'src/enum/issue-priority.enum';
import { IssueStatus } from 'src/enum/issue-status.enum';
import { TagEnum } from 'src/enum/issue-tag.enum';

export class CreateIssueDto {
  @IsOptional()
  @IsInt()
  sprintId?: number;

  @IsEnum(IssueType)
  @IsNotEmpty()
  type: IssueType;

  // 🔥 nếu là SUBTASK thì FE gửi parentIssueId
  @IsOptional()
  @IsInt()
  parentIssueId?: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(TagEnum, { each: true })
  tags?: TagEnum[];

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsInt()
  reporterId?: number;

  @IsOptional()
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  @IsInt()
  createdBy?: number;
}
