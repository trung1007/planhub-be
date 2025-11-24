import { IssueStatus } from 'src/enum/issue-status.enum';
import { IssuePriority } from 'src/enum/issue-priority.enum';
import { TagEnum } from 'src/enum/issue-tag.enum';

export class IssueListDTO {
  id: number;
  name: string;
  summary: string | null;

  tags:TagEnum[] |null

  status: IssueStatus | null;
  priority: IssuePriority | null;

  assigneeId: number | null;
  assigneeName: string | null;

  reporterId: number | null;
  reporterName: string | null;

  sprintId: number | null;
  sprintName: string | null;
}
