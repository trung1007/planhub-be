// dto/create-role-permission.dto.ts
import { IsArray, IsNumber } from 'class-validator';

export class CreateRolePermissionDto {
  @IsNumber()
  role_id: number;

  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds: number[];
}
