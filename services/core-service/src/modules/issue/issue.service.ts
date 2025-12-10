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
import { AssignIssueToSprintDto } from './dto/add-issue-to-sprint.dto';
import { Sprint } from '../sprint/sprint.entity';
import { Release } from '../release/release.entity';
import { Project } from '../project/project.entity';
import { IssueHistoryService } from '../issue-history/issue-history.service';
import { HistoryEvent } from '../issue-history/issue-history.event';
import {
  HistoryAction,
  HistoryEntity,
  IssueHistory,
} from '../issue-history/issue-history.entity';
import { Workflow } from '../workflow/workflow.entity';
import { Status } from '../status/status.entity';
import { Transition } from '../transition/transition.entity';

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

    @InjectRepository(Workflow)
    private readonly workflowRepo: Repository<Workflow>,

    @InjectRepository(Status)
    private readonly statusRepo: Repository<Status>,

    @InjectRepository(Transition)
    private readonly transitionRepo: Repository<Transition>,

    @InjectRepository(IssueHistory)
    private readonly issueHistoryRepo: Repository<IssueHistory>,

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
          is_active: true,
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
          activeSprint: i.sprint.is_active ? i.sprint.name : null,
          // sprintName: i.sprint?.name || null,
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

  async getScrumboard() {
    // Truy vấn tất cả các release của project và sprint đang active
    const releases = await this.releaseRepo.find({
      relations: ['sprints', 'sprints.issues', 'project'],
    });

    // Lọc các sprint đang active
    const activeSprints = releases
      .flatMap((release) => release.sprints || []) // Kiểm tra nếu release.sprints tồn tại
      .filter((sprint) => sprint.is_active);

    if (activeSprints.length === 0) {
      throw new NotFoundException('No active sprints found');
    }

    const issuesByProject = await Promise.all(
      releases.map(async (release) => {
        // Kiểm tra xem release có project hay không
        if (!release.project) {
          throw new NotFoundException(
            'Release does not have associated project',
          );
        }

        // Lọc sprint đang active trong release
        const activeSprintsForProject = release.sprints.filter(
          (sprint) => sprint.is_active,
        );

        // Lấy các issue trong các sprint active của project
        const issuesForProject = await Promise.all(
          activeSprintsForProject.map(async (sprint) => {
            const issues = await this.issueRepo.find({
              where: { sprint_id: sprint.id },
              relations: ['sprint'],
            });

            return issues.map((issue) => ({
              id: issue.id,
              name: issue.name,
              summary: issue.summary,
              type: issue.type,
              tags: issue.tags,
              status: issue.status,
              priority: issue.priority,
              sprintId: issue.sprint?.id,
              sprintName: issue.sprint?.name,
              numOfAttachment: issue.attachments?.length ?? 0,
              numOfSubtask: issue.subtasks?.length ?? 0,
              numOfComment: issue.comments?.length ?? 0,
            }));
          }),
        );

        if (issuesForProject.flat().length === 0) {
          return null;
        }

        const workflow = await this.workflowRepo.findOne({
          where: { project_id: release.project.id },
        });

        if (!workflow) {
          throw new NotFoundException('No workflow found for this project');
        }

        const statuses = await this.statusRepo.find({
          where: { workflow_id: workflow.id },
        });

        const transitions = await this.transitionRepo.find({
          where: { workflow_id: workflow.id },
        });

        return {
          project: {
            id: release.project.id,
            name: release.project.name,
          },
          issues: issuesForProject.flat(),
          workflow: {
            status: statuses.map((status) => ({
              id: status.id,
              name: status.name,
              isInit: status.is_start,
              isFinal: status.is_final,
            })),
            transition: transitions.map((transition) => ({
              id: transition.id,
              statusIdFrom: transition.status_id_from,
              statusIdTo: transition.status_id_to,
            })),
          },
        };
      }),
    );

    const filteredIssuesByProject = issuesByProject.filter(
      (project) => project !== null,
    );

    return filteredIssuesByProject;
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

    const workflow = release?.project_id
      ? await this.workflowRepo.findOne({
          where: { project_id: release?.project_id },
        })
      : null;

    const statusList = workflow?.id
      ? await this.statusRepo.find({
          where: { workflow_id: workflow.id },
        })
      : [];

    const issueResponse = {
      ...issue,
      assigneeId: issue.assignee_id,
      assigneeName: assignee?.username || null,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,

      reporterId: issue.reporter_id,
      reporterName: reporter?.username || null,

      sprintId: issue.sprint?.id || null,
      // sprintName: issue.sprint?.name || null,
      activeSprint: issue.sprint.is_active ? issue.sprint.name : null,
      releaseName: release?.name,
      projectName: project?.name,
      projectId: release?.project_id,

      parentIssueId: issue.parent_issue_id,
      parentIssueName: issue.parent?.name ?? null,

      createdUser: createdUser?.username,
      createdName: createdUser?.fullName,

      subtasksNum: issue.subtasks?.length || 0,

      statusList: statusList.map((status) => ({
        id: status.id,
        name: status.name,
      })),
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
        saved.sprint_id,
        'sprint',
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

    let oldAssignee = null;
    let newAssignee = null;

    if (oldIssue.assignee_id !== issue.assignee_id) {
      if (oldIssue.assignee_id) {
        oldAssignee = await this.userProxy.getUserById(oldIssue.assignee_id);
      }
      if (issue.assignee_id) {
        newAssignee = await this.userProxy.getUserById(issue.assignee_id);
      }
    }

    let oldReporter = null;
    let newReporter = null;

    if (oldIssue.reporter_id !== issue.reporter_id) {
      if (oldIssue.reporter_id) {
        oldReporter = await this.userProxy.getUserById(oldIssue.reporter_id);
      }
      if (issue.reporter_id) {
        newReporter = await this.userProxy.getUserById(issue.reporter_id);
      }
    }

    let oldSprint: Sprint | null = null;
    let newSprint: Sprint | null = null;

    if (oldIssue.sprint_id !== issue.sprint_id) {
      if (oldIssue.sprint_id) {
        oldSprint = await this.sprintRepo.findOne({
          where: { id: oldIssue.sprint_id },
        });
      }

      if (issue.sprint_id) {
        newSprint = await this.sprintRepo.findOne({
          where: { id: issue.sprint_id },
        });

        if (!newSprint) {
          throw new NotFoundException(`Sprint ${issue.sprint_id} not found`);
        }
        issue.sprint = newSprint;
      }
    }

    this.emitIssueUpdateHistory(oldIssue, issue, user_id, {
      oldAssignee,
      newAssignee,
      oldReporter,
      newReporter,
      oldSprint,
      newSprint,
    });
    await this.issueRepo.save(issue);
    return this.findOne(id);
  }

  private emitIssueUpdateHistory(
    oldIssue: Issue,
    newIssue: Issue,
    userId: number,
    labels: {
      oldAssignee: any;
      newAssignee: any;
      oldReporter: any;
      newReporter: any;
      oldSprint: any;
      newSprint: any;
    },
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
      let changed = false;

      // ========= SPECIAL CASE: TAGS (array comparison) =========
      if (field === 'tags') {
        const oldTags = oldIssue.tags ?? [];
        const newTags = newIssue.tags ?? [];

        // Compare value (not reference)
        changed = JSON.stringify(oldTags) !== JSON.stringify(newTags);
      }
      // ========= DEFAULT CASE =========
      else {
        changed = oldIssue[field] !== newIssue[field];
      }

      if (!changed) return;

      if (oldIssue[field] !== newIssue[field]) {
        let label = String(field);
        let oldVal: any = oldIssue[field] ?? '';
        let newVal: any = newIssue[field] ?? '';
        let fieldId: number | null = null;

        switch (field) {
          case 'assignee_id':
            label = 'assignee';
            oldVal = labels.oldAssignee?.username ?? null;
            newVal = labels.newAssignee?.username ?? null;
            fieldId = newIssue.assignee_id ?? null;
            break;

          case 'reporter_id':
            label = 'reporter';
            oldVal = labels.oldReporter?.username ?? null;
            newVal = labels.newReporter?.username ?? null;
            fieldId = newIssue.reporter_id ?? null;
            break;

          case 'sprint_id':
            label = 'sprint';
            oldVal = labels.oldSprint?.name ?? null;
            newVal = labels.newSprint?.name ?? null;
            fieldId = newIssue.sprint_id ?? null;
            break;
        }

        this.historyService.log(
          new HistoryEvent(
            newIssue.id,
            HistoryEntity.ISSUE,
            newIssue.id,
            HistoryAction.ISSUE_UPDATE,
            userId,
            fieldId,
            label,
            oldVal,
            newVal,
            null,
          ),
        );
      }
    });
  }

  async assignIssueToSprint(issueId: number, user_id: number) {
    const nearestActiveSprint =
      await this.getNearestActiveSprintForIssue(issueId);

    if (!nearestActiveSprint) {
      throw new BadRequestException({
        issueId,
        updated: false,
        message: 'No active sprint found',
      });
    }

    // Lấy issue hiện tại
    const issue = await this.issueRepo.findOne({
      where: { id: issueId },
      select: ['id', 'sprint_id'],
    });

    if (!issue) {
      throw new BadRequestException({
        issueId,
        updated: false,
        message: 'Issue not found',
      });
    }

    const oldSprintId = issue.sprint_id;

    // Update sprint
    await this.issueRepo.update(
      { id: issueId },
      {
        sprint_id: nearestActiveSprint.id,
        updated_by: user_id,
      },
    );

    // Fetch old sprint name
    let oldSprint: Sprint | null = null;

    if (oldSprintId) {
      oldSprint = await this.sprintRepo.findOne({ where: { id: oldSprintId } });
    }

    // Log history
    this.historyService.log(
      new HistoryEvent(
        issueId,
        HistoryEntity.ISSUE,
        issueId,
        HistoryAction.ISSUE_UPDATE,
        user_id,
        nearestActiveSprint.id,
        'sprint',
        oldSprint?.name ?? null,
        nearestActiveSprint.name,
        null,
      ),
    );

    return {
      issueId,
      updated: true,
      sprintId: nearestActiveSprint.id,
    };
  }

  async removeByProject(projectId: number) {
    const releases = await this.releaseRepo.find({
      where: { project_id: projectId },
      select: ['id'],
    });

    if (!releases.length) {
      return { deleted: 0 };
    }

    const releaseIds = releases.map((r) => r.id);
    const sprints = await this.sprintRepo.find({
      where: { release_id: In(releaseIds) },
      select: ['id'],
    });

    if (!sprints.length) {
      return { deleted: 0 };
    }

    const sprintIds = sprints.map((s) => s.id);

    const result = await this.issueRepo.delete({
      sprint_id: In(sprintIds),
    });

    return { deleted: result.affected ?? 0 };
  }

  async remove(id: number, user_id: number) {
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

  async getNearestActiveSprintForIssue(issueId: number) {
    // 1️⃣ Lấy lịch sử sprint của issue
    const issueSprintHistory = await this.issueHistoryRepo.find({
      where: {
        issue_id: issueId,
        field: 'sprint',
      },
      select: ['field_id'],
      order: { created_at: 'DESC' },
    });

    if (!issueSprintHistory.length) {
      return null; // Issue chưa từng được gán sprint
    }
    const sprintIdsByOrder = issueSprintHistory
      .map((h) => h.field_id)
      .filter((id): id is number => id !== null);

    if (!sprintIdsByOrder.length) {
      return null;
    }

    // 3️⃣ Lấy toàn bộ sprint thuộc những id này
    const activeSprints = await this.sprintRepo.find({
      where: { id: In(sprintIdsByOrder), is_active: true },
    });

    if (!activeSprints.length) {
      return null; // Không có sprint active nào
    }

    const activeMap = new Map(activeSprints.map((s) => [s.id, s]));

    for (const sprintId of sprintIdsByOrder) {
      if (activeMap.has(sprintId)) {
        return activeMap.get(sprintId);
      }
    }

    return null;
  }
}
