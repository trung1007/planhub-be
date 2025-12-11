import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Release } from './release.entity';
import { ActionReleaseDto } from './dto/action-release.dto';
import { Project } from '../project/project.entity';
import { ReleaseStatus } from '../../enum/release-status.enum';
import { formatDate } from 'src/utils/formatDate';

@Injectable()
export class ReleaseService {
  constructor(
    @InjectRepository(Release)
    private readonly releaseRepo: Repository<Release>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async create(dto: ActionReleaseDto) {
    // 1. Check project tồn tại
    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new BadRequestException(`Project ${dto.projectId} not found`);
    }

    // 2. Check trùng name + version + project_id
    const exists = await this.releaseRepo.findOne({
      where: {
        project_id: dto.projectId,
        name: dto.name,
        version: dto.version,
      },
    });

    if (exists) {
      throw new BadRequestException(
        `Release '${dto.name}' version '${dto.version}' already exists in this project`,
      );
    }

    if (formatDate(dto.startDate) > formatDate(dto.endDate)) {
      throw new BadRequestException(
        'Start date cannot be greater than end date',
      );
    }

    // 3. Convert ngày FE gửi lên (string → Date)
    const release = this.releaseRepo.create({
      ...dto,
      project_id: dto.projectId,
      start_date: formatDate(dto.startDate),
      end_date: formatDate(dto.endDate),
      status: ReleaseStatus.PLANNED,
      created_by: dto.createdId,
    });

    return await this.releaseRepo.save(release);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.releaseRepo.findAndCount({
      relations: ['project'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const items = data.map((r) => ({
      id: r.id,
      projectName: r.project?.name || null,
      name: r.name,
      projectId: r.project_id,
      version: r.version,
      status: r.status,
      startDate: r.start_date,
      endDate: r.end_date,
      description: r.description,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findList() {
    return this.releaseRepo.find({
      select: ['id', 'name', 'project_id'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    return this.releaseRepo.findOne({
      where: { id },
      relations: ['project', 'sprints'],
    });
  }

  async update(id: number, dto: ActionReleaseDto) {
    // 1. Kiểm tra release có tồn tại không
    const existing = await this.releaseRepo.findOne({ where: { id } });

    if (!existing) {
      throw new BadRequestException(`Release ${id} not found`);
    }

    // 2. Check trùng name + version + projectId (trừ chính nó)
    if (dto.name && dto.version && dto.projectId) {
      const duplicate = await this.releaseRepo.findOne({
        where: {
          name: dto.name,
          version: dto.version,
          project_id: dto.projectId,
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(
          `Release '${dto.name}' version '${dto.version}' already exists in this project`,
        );
      }
    }

    if (formatDate(dto.startDate) > formatDate(dto.endDate)) {
      throw new BadRequestException(
        'Start date cannot be greater than end date',
      );
    }

    // 4. Update
    const updateData: Partial<Release> = {
      name: dto.name ?? existing.name,
      version: dto.version ?? existing.version,
      project_id: dto.projectId ?? existing.project_id,
      start_date: formatDate(dto.startDate),
      end_date: formatDate(dto.endDate),
      description: dto.description ?? existing.description,
      created_by: dto.createdId ?? existing.created_by,

      // ⭐ status optional
      status: dto.status ?? existing.status,
    };

    await this.releaseRepo.update(id, updateData);

    return await this.releaseRepo.findOne({
      where: { id },
      relations: ['project'],
    });
  }

  async removeByProject(projectId: number) {
    const releases = await this.releaseRepo.find({
      where: { project_id: projectId },
    });

    if (!releases || releases.length === 0) {
      return { deleted: 0 };
    }

    // Xóa tất cả release
    await this.releaseRepo.remove(releases);

    return { deleted: releases.length };
  }

  async delete(id: number) {
    return this.releaseRepo.delete(id);
  }
}
