import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAttachmentDto {
  @IsInt()
  issueId: number;

  @IsString()
  @IsNotEmpty()
  file_name: string;

  file_data: Buffer;

  @IsString()
  @IsOptional()
  mime_type?: string;
}
