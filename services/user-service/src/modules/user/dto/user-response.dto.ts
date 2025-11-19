import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserResponseDto {
  id: number;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  createdBy?: string;

  createdAt: Date;

  @IsString()
  @IsOptional()
  updatedBy?: string;

  updatedAt: Date;
}
