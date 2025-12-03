import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
} from 'class-validator';

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
  statuses: {
    name: string;
    color: string;
    isInitial: boolean;
    isFinal: boolean;
  }[];

  // Danh sách transition
  @IsArray()
  transitions: {
    name: string;
    from:string,
    to:string,
    status_id_from: number;
    status_id_to: number;
  }[];
}
