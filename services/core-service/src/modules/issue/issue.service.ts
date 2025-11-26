import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Issue } from './issue.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { UserServiceProxy } from 'src/shared/user-service.proxy';
import { IssueListDTO } from './dto/issue-list.dto';
import { AssignIssuesToSprintDto } from './dto/add-issue-to-sprint.dto';
import { Sprint } from '../sprint/sprint.entity';
import { Release } from '../release/release.entity';
import { Project } from '../project/project.entity';

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
      relations: ['sprint'],
    });

    if (!issue) throw new NotFoundException('Issue not found');

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
    };

    return issueResponse;
  }

  async getAllIds(): Promise<{ ids: number[] }> {
    const list = await this.issueRepo.find({
      select: ['id'],
    });

    return {
      ids: list.map((i) => i.id),
    };
  }

  async assignIssuesToSprint(dto: AssignIssuesToSprintDto) {
    const { sprintId, issueIds } = dto;

    // Kiểm tra sprint tồn tại
    const sprint = await this.sprintRepo.findOne({ where: { id: sprintId } });
    if (!sprint) {
      throw new NotFoundException(`Sprint ${sprintId} not found`);
    }

    // Lấy danh sách issue hợp lệ
    const issues = await this.issueRepo.find({
      where: { id: In(issueIds) },
    });

    if (issues.length !== issueIds.length) {
      throw new BadRequestException(`Some issue IDs are invalid`);
    }

    // Update sprint_id
    issues.forEach((i) => (i.sprint_id = sprintId));

    await this.issueRepo.save(issues);

    return {
      message: 'Issues assigned to sprint successfully',
      sprintId,
      issueCount: issues.length,
    };
  }

  async create(dto: CreateIssueDto) {
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
      created_by: dto.createdBy ?? null,
    });
    return this.issueRepo.save(issue);
  }

  async update(id: number, dto: UpdateIssueDto) {
    const issue = await this.findOne(id);

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
      created_by: dto.createdBy ?? issue.created_by,
    });

    return this.issueRepo.save(issue);
  }

  async remove(id: number) {
    await this.issueRepo.delete(id);
    return { deleted: true };
  }
}
