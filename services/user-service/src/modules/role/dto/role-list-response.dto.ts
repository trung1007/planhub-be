// src/modules/role/dto/role-list-response.dto.ts

export class RoleListResponseDto {
  id: number;
  name: string;
  key: string;
  description?: string;

  createdBy?: string;
  createdAt: Date;

  updatedBy?: string;
  updatedAt: Date;
}
