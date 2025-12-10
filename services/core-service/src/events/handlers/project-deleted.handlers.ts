import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IssueService } from 'src/modules/issue/issue.service';
import { ProjectMemberService } from 'src/modules/project-member/project-member.service';
import { ReleaseService } from 'src/modules/release/release.service';
import { SprintService } from 'src/modules/sprint/sprint.service';
import { WorkflowService } from 'src/modules/workflow/workflow.service';

@Injectable()
export class ProjectDeletedHandler {
  private readonly logger = new Logger(ProjectDeletedHandler.name);

  constructor(
    private readonly workflowService: WorkflowService,
    private readonly releaseService: ReleaseService,
    private readonly sprintService: SprintService,
    private readonly projectMemberService: ProjectMemberService,
    private readonly issueService: IssueService,
  ) {}

  @OnEvent('project.deleted')
  async handle(payload: { projectId: number }) {
    const { projectId } = payload;

    this.logger.log(
      `Project deleted → cleanup for project: ${projectId}`,
    );

    await Promise.all([
      this.workflowService.removeByProject(projectId),
      this.releaseService.removeByProject(projectId),
      this.sprintService.removeByProject(projectId),
      this.projectMemberService.removeByProject(projectId),
      this.issueService.removeByProject(projectId),
    ]);

    this.logger.log(`Cleanup completed for project ${projectId}`);
  }
}
