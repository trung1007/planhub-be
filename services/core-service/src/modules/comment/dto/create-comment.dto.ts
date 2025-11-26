// src/modules/comment/dto/create-comment.dto.ts
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsInt()
  issue_id: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  created_by: number;
}
