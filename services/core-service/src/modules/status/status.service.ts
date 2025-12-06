import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from './status.entity';
import { CreateStatusDto, UpdateStatusDto } from './dto/status.dto';
import { Sprint } from '../sprint/sprint.entity';
import { Workflow } from '../workflow/workflow.entity';
import { Release } from '../release/release.entity';
import { Project } from '../project/project.entity';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(Status)
    private readonly statusRepo: Repository<Status>,
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    @InjectRepository(Release)
    private readonly releaseRepository: Repository<Release>,
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
  ) {}

  findAll(workflowId: number) {
    return this.statusRepo.find({
      where: { workflow_id: workflowId },
      order: { id: 'ASC' },
    });
  }

  async findAllBySprintId(sprintId: number) {
    // Tìm sprint và lấy release liên quan
    const sprint = await this.sprintRepository.findOne({
      where: { id: sprintId },
      relations: ['release'],
    });

    if (!sprint) {
      throw new Error('Sprint not found');
    }

    // Tìm release và lấy project liên quan
    const release = await this.releaseRepository.findOne({
      where: { id: sprint.release.id },
      relations: ['project'],
    });

    if (!release) {
      throw new Error('Release not found');
    }

    // Tìm workflow liên quan đến project
    const workflow = await this.workflowRepository.findOne({
      where: { project_id: release.project.id },
    });

    if (!workflow) {
      throw new Error('Workflow not found for the project');
    }

    // Tìm tất cả status liên quan đến workflow
    const statuses = await this.statusRepo.find({
      where: { workflow_id: workflow.id },
    });

    const listStatusRes = statuses.map((s) => ({
      id: s.id, // Trả về id
      name: s.name, // Trả về name
    }));

    return listStatusRes;
  }

  findOne(id: number) {
    return this.statusRepo.findOne({ where: { id } });
  }

  create(dto: CreateStatusDto, user_id: number) {
    const status = this.statusRepo.create({
      workflow_id: dto.workflow_id,
      name: dto.name,
      is_start: dto.is_start,
      is_final: dto.is_final,
      created_by: user_id,
    });
    return this.statusRepo.save(status);
  }

  update(id: number, dto: UpdateStatusDto) {
    return this.statusRepo.update(id, dto);
  }

  remove(id: number) {
    return this.statusRepo.delete(id);
  }
}
