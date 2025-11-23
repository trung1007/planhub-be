import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  IsInt,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ReleaseStatus } from '../enum/release-status.enum';

export class ActionReleaseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  version: string;

  @IsNotEmpty()
  @IsNumber()
  projectId: number;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsNotEmpty()
  @IsInt()
  createdId: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsOptional()
  @IsEnum(ReleaseStatus)
  status?: ReleaseStatus;
}
