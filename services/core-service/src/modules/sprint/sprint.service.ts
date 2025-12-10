import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { formatDate } from 'src/utils/formatDate';
import { Sprint } from './sprint.entity';
import { ActionSprintDto } from './dto/action-sprint.dto';
import { Release } from '../release/release.entity';
import { SprintListDto } from './dto/sprint-list.dto';
import { Issue } from '../issue/issue.entity';
@Injectable()
export class SprintService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,

    @InjectRepository(Release)
    private readonly releaseRepo: Repository<Release>,

    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
  ) {}

  async create(dto: ActionSprintDto) {
    // 1. Check project tồn tại
    const release = await this.releaseRepo.findOne({
      where: { id: dto.releaseId },
    });

    if (!release) {
      throw new BadRequestException(`Release ${dto.releaseId} not found`);
    }
    const exists = await this.sprintRepo.findOne({
      where: {
        release_id: dto.releaseId,
        name: dto.name,
        key: dto.key,
      },
    });

    if (exists) {
      throw new BadRequestException(
        `Sprint '${dto.name}' key '${dto.key}' already exists in this release`,
      );
    }

    if (formatDate(dto.startDate) > formatDate(dto.endDate)) {
      throw new BadRequestException(
        'Start date cannot be greater than end date',
      );
    }

    // 3. Convert ngày FE gửi lên (string → Date)
    const sprint = this.sprintRepo.create({
      ...dto,
      release_id: dto.releaseId,
      is_active: dto.isActive,
      start_date: formatDate(dto.startDate),
      end_date: formatDate(dto.endDate),
      created_by: dto.createdId,
    });

    return await this.sprintRepo.save(sprint);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.sprintRepo.findAndCount({
      relations: ['release'],
      skip,
      take: limit,
      order: { release_id: 'ASC' },
    });

    const items: SprintListDto[] = [];

    for (const s of data) {
      const issues = await this.issueRepo.find({
        where: { sprint_id: s.id },
        select: ['id'], 
      });

      items.push({
        id: s.id,
        releaseName: s.release?.name || null,
        releaseId: s.release_id,
        name: s.name,
        key: s.key,
        startDate: s.start_date,
        endDate: s.end_date,
        isActive: s.is_active,
        numOfIssue: issues.length,
      });
    }

    // const items: SprintListDto[] = data.map((s) => ({
    //   id: s.id,
    //   releaseName: s.release?.name || null,
    //   releaseId: s.release_id,
    //   name: s.name,
    //   key: s.key,
    //   startDate: s.start_date,
    //   endDate: s.end_date,
    //   isActive: s.is_active,
    // }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findList() {
    return this.sprintRepo.find({
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
  }

  async findActiveSprintByProject(projectId: number) {
    return this.sprintRepo
      .createQueryBuilder('sprint')
      .leftJoinAndSelect('sprint.release', 'release')
      .leftJoinAndSelect('release.project', 'project')
      .where('project.id = :projectId', { projectId })
      .andWhere('sprint.is_active = :isActive', { isActive: true })
      .orderBy('sprint.name', 'ASC')
      .select(['sprint.id', 'sprint.name', 'sprint.is_active'])
      .getMany();
  }

  async findActiveSprint() {
    return this.sprintRepo.find({
      select: ['id', 'is_active', 'name'],
      where: { is_active: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    return this.sprintRepo.findOne({
      where: { id },
      relations: ['project', 'sprints'],
    });
  }

  async update(id: number, dto: ActionSprintDto) {
    // 1. Tìm sprint
    const sprint = await this.sprintRepo.findOne({ where: { id } });

    if (!sprint) {
      throw new NotFoundException(`Sprint ${id} not found`);
    }

    // 2. Check release tồn tại
    const release = await this.releaseRepo.findOne({
      where: { id: dto.releaseId },
    });

    if (!release) {
      throw new BadRequestException(`Release ${dto.releaseId} not found`);
    }

    const exists = await this.sprintRepo.findOne({
      where: {
        release_id: dto.releaseId,
        name: dto.name,
        key: dto.key,
      },
    });

    if (exists && exists.id !== id) {
      throw new BadRequestException(
        `Sprint '${dto.name}' key '${dto.key}' already exists in this release`,
      );
    }

    // 4. Validate ngày
    if (formatDate(dto.startDate) > formatDate(dto.endDate)) {
      throw new BadRequestException(
        'Start date cannot be greater than end date',
      );
    }
    Object.assign(sprint, {
      ...dto,
      release_id: dto.releaseId,
      is_active: dto.isActive,
      start_date: formatDate(dto.startDate),
      end_date: formatDate(dto.endDate),
      created_by: dto.createdId,
    });

    return await this.sprintRepo.save(sprint);
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

    const result = await this.sprintRepo.delete({
      release_id: In(releaseIds),
    });

    return { deleted: result.affected ?? 0 };
  }

  async delete(id: number) {
    return this.sprintRepo.delete(id);
  }
}
