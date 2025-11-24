// src/sprint/dto/action-sprint.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsOptional,
  IsDate,
  Min,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ActionSprintDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsNumber()
  @IsNotEmpty()
  releaseId: number;

  @IsBoolean()
  isActive: boolean;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsNumber()
  @IsNotEmpty()
  createdId: number;

  @IsOptional()
  @IsString()
  description?: string;
}
