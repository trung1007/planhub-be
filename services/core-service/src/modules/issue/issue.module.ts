import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './issue.entity';
import { Attachment } from '../attachment/attachment.entity';
import { Comment } from '../comment/comment.entity';
import { Subtask } from '../subtask/subtask.entity';
import { IssueController } from './issue.controller';
import { IssueService } from './issue.service';
import { SharedModule } from 'src/shared/shared.module';
import { Sprint } from '../sprint/sprint.entity';
import { Release } from '../release/release.entity';
import { Project } from '../project/project.entity';
import { IssueHistoryModule } from '../issue-history/issue-history.module';
import { IssueHistory } from '../issue-history/issue-history.entity';
import { Workflow } from '../workflow/workflow.entity';
import { Status } from '../status/status.entity';
import { Transition } from '../transition/transition.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Issue,
      Attachment,
      Comment,
      Subtask,
      Sprint,
      Project,
      Release,
      IssueHistory,
      Workflow,
      Status,
      Transition,
    ]),
    SharedModule,
    IssueHistoryModule,
  ],
  controllers: [IssueController],
  providers: [IssueService],
  exports: [IssueService],
})
export class IssueModule {}
