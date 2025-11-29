import { Type } from 'class-transformer';
import { IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class AssignIssueToSprintDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Type(() => Number)
  issueId: number;
}
