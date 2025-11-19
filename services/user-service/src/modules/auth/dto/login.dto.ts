import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Username không hợp lệ' })
  username?: string;

  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  @IsString()
  password: string;
}
