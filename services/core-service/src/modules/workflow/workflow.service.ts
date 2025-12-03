// workflow.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Workflow } from './workflow.entity';
import { Project } from '../project/project.entity';
import { Status } from '../status/status.entity';
import { Transition } from '../transition/transition.entity';
import { CreateWorkflowDto } from './create-workflow.dto';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepo: Repository<Workflow>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(Status)
    private statusRepo: Repository<Status>,

    @InjectRepository(Transition)
    private transitionRepo: Repository<Transition>,

    private dataSource: DataSource,
  ) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.workflowRepo.findAndCount({
      relations: {
        project: true,
      },
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
        created_at: true,
        updated_at: true,
        created_by: true,
        updated_by: true,
        project: {
          id: true,
          name: true,
        },
      },
      order: {
        project: {
          name: 'ASC',
        },
      },
      skip,
      take: limit,
    });

    const result = data.map((item) => ({
      id: item.id,
      name: item.name,
      key: item.key,
      projectName: item.project?.name,
      description: item.description,
      createdBy: item.created_by,
      updatedBy: item.updated_by,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return {
      total,
      page,
      limit,
      items: result,
    };
  }

  async findOne(id: number) {
    return this.workflowRepo.findOne({
      where: { id },
      relations: {
        project: true,
      },
      select: {
        id: true,
        name: true,
        key: true,
        version: true,
        description: true,
        created_at: true,
        updated_at: true,
        project: {
          id: true,
          name: true,
        },
      },
    });
  }

  async createWorkflow(dto: CreateWorkflowDto, user_id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        name,
        key,
        version,
        projectId,
        description,
        statuses,
        transitions,
      } = dto;

      // 1️⃣ Tạo workflow
      const workflow = queryRunner.manager.create(Workflow, {
        name,
        key,
        version,
        project_id: projectId,
        description,
        created_by: user_id,
        updated_by: user_id,
      });

      const savedWorkflow = await queryRunner.manager.save(Workflow, workflow);

      // 2️⃣ Lưu Status
      const statusEntities = statuses.map((s) =>
        queryRunner.manager.create(Status, {
          workflow_id: savedWorkflow.id,
          name: s.name,
          color: s.color,
          is_start: s.isInitial,
          is_final: s.isFinal,
          created_by: user_id,
        }),
      );

      const savedStatuses = await queryRunner.manager.save(
        Status,
        statusEntities,
      );

      // Tạo map để tìm status_id theo name
      const statusMap = new Map<string, number>();
      savedStatuses.forEach((s) => statusMap.set(s.name, s.id));

      // 3️⃣ Lưu Transition
      const transitionEntities = transitions.map((t) =>
        queryRunner.manager.create(Transition, {
          workflow_id: savedWorkflow.id,
          name: t.name,
          status_id_from: statusMap.get(t.from),
          status_id_to: statusMap.get(t.to),
          created_by: user_id,
        }),
      );

      const savedTransitions = await queryRunner.manager.save(
        Transition,
        transitionEntities,
      );

      // 4️⃣ Commit transaction
      await queryRunner.commitTransaction();

      return {
        workflow: savedWorkflow,
        statuses: savedStatuses,
        transitions: savedTransitions,
      };
    } catch (error) {
      // ❌ Rollback nếu lỗi
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
