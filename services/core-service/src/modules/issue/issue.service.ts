import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Issue } from './issue.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { UserServiceProxy } from 'src/shared/user-service.proxy';
import { IssueListDTO } from './dto/issue-list.dto';
import { AssignIssuesToSprintDto } from './dto/add-issue-to-sprint.dto';
import { Sprint } from '../sprint/sprint.entity';
import { Release } from '../release/release.entity';
import { Project } from '../project/project.entity';
import { IssueHistoryService } from '../issue-history/issue-history.service';
import { HistoryEvent } from '../issue-history/issue-history.event';
import {
  HistoryAction,
  HistoryEntity,
} from '../issue-history/issue-history.entity';

@Injectable()
export class IssueService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    private readonly userProxy: UserServiceProxy,
    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,
    @InjectRepository(Release)
    private readonly releaseRepo: Repository<Release>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    private readonly historyService: IssueHistoryService,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [issues, total] = await this.issueRepo.findAndCount({
      select: {
        id: true,
        name: true,
        summary: true,
        type: true,
        tags: true,
        description: true,
        status: true,
        priority: true,
        sprint: {
          id: true,
          name: true,
        },
        assignee_id: true,
        reporter_id: true,
      },
      where: {
        parent_issue_id: IsNull(),
      },
      relations: ['sprint'],
      skip,
      take: limit,
      order: { id: 'DESC' },
    });

    const items: IssueListDTO[] = await Promise.all(
      issues.map(async (i) => {
        const assignee = i.assignee_id
          ? await this.userProxy.getUserById(i.assignee_id)
          : null;

        const reporter = i.reporter_id
          ? await this.userProxy.getUserById(i.reporter_id)
          : null;

        return {
          id: i.id,
          name: i.name,
          summary: i.summary,
          description: i.description,
          type: i.type,

          tags: i.tags ?? null,

          status: i.status,
          priority: i.priority,

          assigneeId: i.assignee_id,
          assigneeName: assignee?.username || null,

          reporterId: i.reporter_id,
          reporterName: reporter?.username || null,

          sprintId: i.sprint?.id || null,
          sprintName: i.sprint?.name || null,
        };
      }),
    );

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  async findOne(id: number) {
    const issue = await this.issueRepo.findOne({
      where: { id },
      relations: ['sprint', 'subtasks', 'parent'],
    });

    if (!issue) throw new NotFoundException('Issue not found');

    const createdUser = issue.created_by
      ? await this.userProxy.getUserById(issue.created_by)
      : null;

    const assignee = issue.assignee_id
      ? await this.userProxy.getUserById(issue.assignee_id)
      : null;

    const reporter = issue.reporter_id
      ? await this.userProxy.getUserById(issue.reporter_id)
      : null;

    const release = issue.sprint.release_id
      ? await this.releaseRepo.findOne({
          where: { id: issue.sprint.release_id },
        })
      : null;

    const project = release?.project_id
      ? await this.projectRepo.findOne({ where: { id: release.project_id } })
      : null;

    const issueResponse = {
      ...issue,
      assigneeId: issue.assignee_id,
      assigneeName: assignee?.username || null,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,

      reporterId: issue.reporter_id,
      reporterName: reporter?.username || null,

      sprintId: issue.sprint?.id || null,
      sprintName: issue.sprint?.name || null,
      releaseName: release?.name,
      projectName: project?.name,

      parentIssueId: issue.parent_issue_id,
      parentIssueName: issue.parent?.name ?? null,

      createdUser: createdUser?.username,
      createdName: createdUser?.fullName,

      subtasksNum: issue.subtasks?.length || 0,
    };

    return issueResponse;
  }

  async findSubtasks(parentId: number, page: number = 1, limit: number = 10) {
    const parent = await this.issueRepo.findOne({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException('Parent issue not found');
    }

    const skip = (page - 1) * limit;

    const [subtasks, total] = await this.issueRepo.findAndCount({
      where: { parent_issue_id: parentId },
      relations: ['sprint'],
      order: { id: 'ASC' },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        summary: true,
        description: true,
        type: true,
        tags: true,
        status: true,
        priority: true,
        assignee_id: true,
        reporter_id: true,
        sprint: {
          id: true,
          name: true,
        },
      },
    });

    const items = await Promise.all(
      subtasks.map(async (i) => {
        const assignee = i.assignee_id
          ? await this.userProxy.getUserById(i.assignee_id)
          : null;

        const reporter = i.reporter_id
          ? await this.userProxy.getUserById(i.reporter_id)
          : null;

        return {
          id: i.id,
          name: i.name,
          summary: i.summary,
          description: i.description,
          type: i.type,
          tags: i.tags ?? null,
          status: i.status,
          priority: i.priority,

          assigneeId: i.assignee_id,
          assigneeName: assignee?.username || null,

          reporterId: i.reporter_id,
          reporterName: reporter?.username || null,

          sprintId: i.sprint?.id || null,
          sprintName: i.sprint?.name || null,
        };
      }),
    );

    return {
      parentId,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  async getAllIds(): Promise<{ ids: number[] }> {
    const list = await this.issueRepo.find({
      select: ['id'],
    });

    return {
      ids: list.map((i) => i.id),
    };
  }

  async getListIssue() {
    return this.issueRepo.find({
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateIssueDto, user_id: number) {
    const issue = this.issueRepo.create({
      sprint_id: dto.sprintId ?? null,
      type: dto.type,
      name: dto.name,
      summary: dto.summary ?? null,
      description: dto.description ?? null,
      tags: dto.tags ?? null,
      status: dto.status ?? null,
      priority: dto.priority ?? null,
      reporter_id: dto.reporterId ?? null,
      assignee_id: dto.assigneeId ?? null,
      created_by: user_id,
      parent_issue_id: dto.parentIssueId ?? null,
    });
    const saved = await this.issueRepo.save(issue);
    this.historyService.log(
      new HistoryEvent(
        saved.id,
        HistoryEntity.ISSUE,
        saved.id,
        HistoryAction.ISSUE_CREATE,
        saved.created_by,
        null,
        null,
        null,
        {
          name: saved.name,
          type: saved.type,
        },
      ),
    );
    return saved;
  }

  async update(id: number, dto: UpdateIssueDto, user_id: number) {
    const issue = await this.findOne(id);

    const oldIssue = { ...issue };

    Object.assign(issue, {
      sprint_id: dto.sprintId ?? issue.sprint_id,
      type: dto.type ?? issue.type,
      name: dto.name ?? issue.name,
      summary: dto.summary ?? issue.summary,
      description: dto.description ?? issue.description,
      tags: dto.tags ?? issue.tags,
      status: dto.status ?? issue.status,
      priority: dto.priority ?? issue.priority,
      reporter_id: dto.reporterId ?? issue.reporter_id,
      assignee_id: dto.assigneeId ?? issue.assignee_id,
      updated_id: user_id,
      parent_issue_id: dto.parentIssueId ?? issue.parent_issue_id,
    });
    this.emitIssueUpdateHistory(oldIssue, issue, user_id);

    return this.issueRepo.save(issue);
  }

  private emitIssueUpdateHistory(
    oldIssue: Issue,
    newIssue: Issue,
    userId: number,
  ) {
    const fields: (keyof Issue)[] = [
      'name',
      'summary',
      'description',
      'status',
      'priority',
      'tags',
      'type',
      'assignee_id',
      'reporter_id',
      'sprint_id',
      'parent_issue_id',
    ];

    fields.forEach((field) => {
      if (oldIssue[field] !== newIssue[field]) {
        this.historyService.log(
          new HistoryEvent(
            newIssue.id,
            HistoryEntity.ISSUE,
            newIssue.id,
            HistoryAction.ISSUE_UPDATE,
            userId,
            String(field),
            String(oldIssue[field] ?? ''),
            String(newIssue[field] ?? ''),
            null,
          ),
        );
      }
    });
  }

  async remove(id: number, user_id:number) {
    const issue = await this.issueRepo.findOne({ where: { id } });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // Xoá issue
    await this.issueRepo.delete(id);

    // Emit history event
    this.historyService.log(
      new HistoryEvent(
        id, // issue_id
        HistoryEntity.ISSUE, 
        id, // entity_id (issue id)
        HistoryAction.ISSUE_DELETE,
        user_id, 
        null, 
        null, 
        null,
        {
          deleted_name: issue.name,
          deleted_summary: issue.summary,
        },
      ),
    );

    return { deleted: true };
  }
}
