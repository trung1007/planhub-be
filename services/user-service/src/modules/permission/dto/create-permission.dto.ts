import { IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  name: string;

  @IsString()
  key: string;

  @IsString()
  method: string; // GET / POST / PUT / DELETE

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  description?: string;
}
