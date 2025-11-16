import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  fullName?: string;

  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

}
