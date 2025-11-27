// src/modules/comment/comment.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './comment.entity';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('issue/:issueId')
  async getByIssueId(
    @Param('issueId', ParseIntPipe) issueId: number,
  ): Promise<Comment[]> {
    return this.commentService.getByIssueId(issueId);
  }

  @Post()
  async create(@Body() dto: CreateCommentDto, @Req() req): Promise<Comment> {
    const user_id = Number(req.headers['x-user-id']);
    return this.commentService.create(dto, user_id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @Req() req,
  ): Promise<Comment> {
    const user_id = Number(req.headers['x-user-id']);
    return this.commentService.update(id, dto, user_id);
  }

  // DELETE /comments/:id
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ): Promise<void> {
    const user_id = Number(req.headers['x-user-id']);
    return this.commentService.remove(id, user_id);
  }
}
