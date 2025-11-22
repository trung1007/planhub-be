import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Project } from './project.entity';
import { UserServiceProxy } from 'src/shared/user-service.proxy';
import { ProjectListDto } from './dto/project-list.dto';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
    private readonly userProxy: UserServiceProxy,
  ) {}

  async create(dto: CreateProjectDto) {
    const project = this.repo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      creator_id: dto.creatorId,
    });

    return this.repo.save(project);
  }

  async findAll(page = 1, limit = 10, keyword = '') {
    const [projects, total] = await this.repo.findAndCount({
      where: keyword
        ? [{ name: Like(`%${keyword}%`) }, { code: Like(`%${keyword}%`) }]
        : {},
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items: ProjectListDto[] = await Promise.all(
      projects.map(async (p) => {
        const dto = new ProjectListDto();

        dto.id = p.id;
        dto.code = p.code;
        dto.name = p.name;
        dto.description = p.description;

        dto.creatorId = p.creator_id;
        dto.createdAt = p.created_at;
        dto.updatedAt = p.updated_at;

        const creator = await this.userProxy.getUserById(p.creator_id);
        dto.creatorName = creator?.username || null;

        return dto;
      }),
    );

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findList() {
    return this.repo.find({
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const project = await this.repo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  async update(id: number, dto: CreateProjectDto) {
    const project = await this.findOne(id);
    Object.assign(project, {
      code: dto.code,
      name: dto.name,
      description: dto.description,
      creator_id: dto.creatorId,
    });
    return this.repo.save(project);
  }

  async remove(id: number) {
    const project = await this.findOne(id);
    return this.repo.remove(project);
  }
}
