import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateRoleDto extends PartialType(
  OmitType(CreateRoleDto, ['createdUserId'] as const),
) {
  @IsNotEmpty()
  updatedUserId: number;
}
