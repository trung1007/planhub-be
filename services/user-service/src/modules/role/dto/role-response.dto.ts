import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { Permission } from 'src/modules/permission/permission.entity';

export class RoleResponseDto {
  id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  createdBy?: string;

  createdAt: Date;

  @IsString()
  @IsOptional()
  updatedBy?: string;

  updatedAt: Date;

  @IsArray()
  @IsOptional()
  permissions?: Permission[];
}
