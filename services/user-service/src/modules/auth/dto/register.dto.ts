import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString({ message: 'Username không hợp lệ' })
  username: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  phoneNumber?: string;

  @IsEmail()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}
