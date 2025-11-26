// src/modules/comment/comment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserServiceProxy } from 'src/shared/user-service.proxy';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly userProxy: UserServiceProxy,
  ) {}

  async getByIssueId(issueId: number): Promise<Comment[]> {
    const comments = await this.commentRepository.find({
      where: { issue_id: issueId },
      order: { created_at: 'ASC' },
    });

    const result = await Promise.all(
      comments.map(async (comment) => {
        const user = await this.userProxy.getUserById(comment.created_by);
        // giả sử user có field username, nếu khác thì đổi lại
        const username = user && user.username;
        const fullName = user && user.fullName;

        const dto = {
          ...comment,
          username: username ?? null,
          fullName: fullName ?? null,
        };

        return dto;
      }),
    );

    return result;
  }

  async create(dto: CreateCommentDto): Promise<Comment> {
    // Nếu muốn check issue tồn tại thì thêm logic check Issue ở đây

    const comment = this.commentRepository.create({
      issue_id: dto.issue_id,
      content: dto.content,
      created_by: dto.created_by,
    });

    return this.commentRepository.save(comment);
  }

  async update(id: number, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    comment.content = dto.content;
    comment.created_by = dto.upadatedBy;

    return this.commentRepository.save(comment);
  }

  async remove(id: number): Promise<void> {
    const result = await this.commentRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
  }
}
