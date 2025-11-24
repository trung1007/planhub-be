import { Type } from 'class-transformer';
import { IsInt, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class AssignIssuesToSprintDto {
  @IsInt()
  @Type(() => Number)
  sprintId: number;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Type(() => Number)
  issueIds: number[];
}
