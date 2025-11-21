import { Permission } from 'src/modules/permission/permission.entity';

export class RoleDetailResponseDto {
  id: number;
  name: string;
  key: string;
  permissions: Permission[];
}
