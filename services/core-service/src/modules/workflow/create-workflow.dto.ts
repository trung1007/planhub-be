import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { IssueStatus } from 'src/enum/issue-status.enum';

export class CreateWorkflowDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  // Danh sách status
  @IsArray()
  statuses: CreateStatusDto[];

  // Danh sách transition
  @IsArray()
  transitions: CreateTransitionDto[];
}

export class CreateStatusDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsEnum(IssueStatus) // Enum validation to ensure only valid status values
  name: IssueStatus;


  @IsBoolean()
  isInitial: boolean;

  @IsBoolean()
  isFinal: boolean;

}

export class CreateTransitionDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  name: string;

  @IsString()
  from: string;

  @IsString()
  to: string;

  @IsNumber()
  status_id_from: number;

  @IsNumber()
  status_id_to: number;
}
