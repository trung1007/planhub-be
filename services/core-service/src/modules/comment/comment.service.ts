// src/modules/comment/comment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserServiceProxy } from 'src/shared/user-service.proxy';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { IssueHistoryService } from '../issue-history/issue-history.service';
import { HistoryEvent } from '../issue-history/issue-history.event';
import {
  HistoryAction,
  HistoryEntity,
} from '../issue-history/issue-history.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly userProxy: UserServiceProxy,
    private readonly historyService: IssueHistoryService,
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

  async create(dto: CreateCommentDto, user_id): Promise<Comment> {
    // Nếu muốn check issue tồn tại thì thêm logic check Issue ở đây

    const comment = this.commentRepository.create({
      issue_id: dto.issue_id,
      content: dto.content,
      created_by: user_id,
    });

    const saved = await this.commentRepository.save(comment);

    // 🔥 Emit History Event
    this.historyService.log(
      new HistoryEvent(
        saved.issue_id,
        HistoryEntity.COMMENT,
        saved.id,
        HistoryAction.COMMENT_ADD,
        user_id,
        null,
        null,
        null,
        {
          content: saved.content,
        },
      ),
    );

    return saved;
  }

  async update(
    id: number,
    dto: UpdateCommentDto,
    user_id: number,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    const oldContent = comment.content;
    comment.content = dto.content;
    comment.updated_by = user_id;

    const saved = await this.commentRepository.save(comment);

    // 🔥 Emit History Event
    this.historyService.log(
      new HistoryEvent(
        saved.issue_id,
        HistoryEntity.COMMENT,
        saved.id,
        HistoryAction.COMMENT_EDIT,
        user_id,
        null,
        oldContent,
        saved.content,
        null,
      ),
    );

    return saved;
  }

  async remove(id: number, user_id: number): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    await this.commentRepository.remove(comment);

    this.historyService.log(
      new HistoryEvent(
        comment.issue_id,
        HistoryEntity.COMMENT,
        comment.id,
        HistoryAction.COMMENT_DELETE,
        user_id,
        null,
        null,
        null,
        {
          deleted_content: comment.content,
        },
      ),
    );
  }
}
