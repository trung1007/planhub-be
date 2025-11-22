import { IsNotEmpty, IsInt, IsString } from 'class-validator';

export class CreateProjectMemberDto {
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @IsInt()
  roleId: number;

  @IsNotEmpty()
  @IsInt()
  projectId?: number;

  @IsString()
  joinDate: string;

  @IsNotEmpty()
  @IsInt()
  createdId: number;
}
