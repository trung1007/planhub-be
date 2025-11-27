// src/modules/comment/comment.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comment.entity';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { SharedModule } from 'src/shared/shared.module';
import { IssueHistoryModule } from '../issue-history/issue-history.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), SharedModule, IssueHistoryModule],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
