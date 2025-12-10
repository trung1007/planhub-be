import { Module } from '@nestjs/common';
import { ReleaseModule } from 'src/modules/release/release.module';
import { WorkflowModule } from 'src/modules/workflow/workflow.module';
import { ProjectDeletedHandler } from './handlers/project-deleted.handlers';
import { SprintModule } from 'src/modules/sprint/sprint.module';
import { ProjectMemberModule } from 'src/modules/project-member/project-member.module';
import { IssueModule } from 'src/modules/issue/issue.module';

@Module({
  imports: [WorkflowModule, ReleaseModule, SprintModule, ProjectMemberModule, IssueModule],
  providers: [ProjectDeletedHandler],
})
export class EventHandlersModule {}
