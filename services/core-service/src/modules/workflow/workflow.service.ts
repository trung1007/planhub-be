// workflow.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, Repository } from 'typeorm';
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

  // async createWorkflow(dto: CreateWorkflowDto, user_id: number) {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const {
  //       name,
  //       key,
  //       version,
  //       projectId,
  //       description,
  //       statuses,
  //       transitions,
  //     } = dto;

  //     // 1️⃣ CREATE workflow
  //     const workflow = queryRunner.manager.create(Workflow, {
  //       name,
  //       key,
  //       version,
  //       project_id: projectId,
  //       description,
  //       created_by: user_id,
  //       updated_by: user_id,
  //     });

  //     const savedWorkflow = await queryRunner.manager.save(Workflow, workflow);

  //     // 2️⃣ CREATE all statuses
  //     const statusEntities = statuses.map((s) =>
  //       queryRunner.manager.create(Status, {
  //         workflow_id: savedWorkflow.id,
  //         name: s.name,
  //         color: s.color,
  //         is_start: s.isInitial,
  //         is_final: s.isFinal,
  //         created_by: user_id,
  //       }),
  //     );

  //     const savedStatuses = await queryRunner.manager.save(
  //       Status,
  //       statusEntities,
  //     );

  //     // Create map name → id
  //     const statusMap = new Map<string, number>();

  //     statuses.forEach((clientStatus, index) => {
  //       const saved = savedStatuses[index];

  //       // map name FE -> id thật
  //       statusMap.set(clientStatus.name.trim().toLowerCase(), saved.id);

  //       // map id FE -> id thật (id FE có thể là số random)
  //       if (clientStatus.id) {
  //         statusMap.set(String(clientStatus.id), saved.id);
  //       }
  //     });

  //     // 3️⃣ Lưu Transition
  //     const transitionEntities = transitions.map((t) =>
  //       queryRunner.manager.create(Transition, {
  //         workflow_id: savedWorkflow.id,
  //         name: t.name,
  //         status_id_from: t.status_id_from
  //           ? statusMap.get(String(t.status_id_from))
  //           : statusMap.get(t.from?.trim().toLowerCase()),
  //         status_id_to: t.status_id_to
  //           ? statusMap.get(String(t.status_id_to))
  //           : statusMap.get(t.to?.trim().toLowerCase()),
  //         created_by: user_id,
  //       }),
  //     );
  //     const savedTransitions = await queryRunner.manager.save(
  //       Transition,
  //       transitionEntities,
  //     );

  //     await queryRunner.commitTransaction();

  //     return {
  //       workflow: savedWorkflow,
  //       statuses: savedStatuses,
  //       transitions: savedTransitions,
  //     };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  // async updateWorkflow(id: number, dto: CreateWorkflowDto, user_id: number) {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const {
  //       name,
  //       key,
  //       version,
  //       projectId,
  //       description,
  //       statuses,
  //       transitions,
  //     } = dto;

  //     // 1️⃣ Check workflow tồn tại và thuộc user
  //     const workflow = await queryRunner.manager.findOne(Workflow, {
  //       where: { id, created_by: user_id },
  //     });

  //     if (!workflow) {
  //       throw new NotFoundException('Workflow not found or not owned by user.');
  //     }

  //     // 2️⃣ UPDATE workflow
  //     workflow.name = name;
  //     workflow.key = key || '';
  //     workflow.version = version || '';
  //     workflow.project_id = projectId || 0;
  //     workflow.description = description || '';
  //     workflow.updated_by = user_id;

  //     await queryRunner.manager.save(Workflow, workflow);

  //     // 3️⃣ Fetch statuses và transitions đang có trong DB
  //     const existingStatuses = await queryRunner.manager.find(Status, {
  //       where: { workflow_id: id },
  //     });

  //     const existingTransitions = await queryRunner.manager.find(Transition, {
  //       where: { workflow_id: id },
  //     });

  //     const existingStatusIds = existingStatuses.map((s) => s.id);
  //     const incomingStatusIds = statuses.map((s) => Number(s.id));

  //     const existingTransitionIds = existingTransitions.map((t) => t.id);
  //     const incomingTransitionIds = transitions.map((t) => String(t.id));

  //     // 4️⃣ DELETE status không còn trong FE
  //     const statusToDelete = existingStatuses.filter(
  //       (s) => !incomingStatusIds.includes(s.id),
  //     );
  //     if (statusToDelete.length > 0) {
  //       await queryRunner.manager.remove(Status, statusToDelete);
  //     }

  //     // 5️⃣ UPDATE hoặc INSERT status
  //     const savedStatuses = [];

  //     for (const s of statuses) {
  //       if (existingStatusIds.includes(Number(s.id))) {
  //         // Update
  //         await queryRunner.manager.update(
  //           Status,
  //           { id: s.id },
  //           {
  //             name: s.name,
  //             color: s.color,
  //             is_start: s.isInitial,
  //             is_final: s.isFinal,
  //             updated_by: user_id,
  //           },
  //         );
  //         savedStatuses.push(s);
  //       } else {
  //         // Insert new
  //         const newStatus = queryRunner.manager.create(Status, {
  //           workflow_id: id,
  //           name: s.name,
  //           color: s.color,
  //           is_start: s.isInitial,
  //           is_final: s.isFinal,
  //           created_by: user_id,
  //         });
  //         const saved = await queryRunner.manager.save(Status, newStatus);
  //         savedStatuses.push(saved);
  //       }
  //     }

  //     // Map name → status_id
  //     const statusMap = new Map<string, number>();
  //     const updatedDBStatuses = await queryRunner.manager.find(Status, {
  //       where: { workflow_id: id },
  //     });

  //     updatedDBStatuses.forEach((s) => statusMap.set(s.name, s.id));

  //     // 6️⃣ DELETE transitions không còn trong FE
  //     const transitionToDelete = existingTransitions.filter(
  //       (t) => !incomingTransitionIds.includes(String(t.id)),
  //     );

  //     if (transitionToDelete.length > 0) {
  //       await queryRunner.manager.remove(Transition, transitionToDelete);
  //     }

  //     // 7️⃣ UPDATE hoặc INSERT transition
  //     const savedTransitions = [];

  //     for (const t of transitions) {
  //       const isExisting = existingTransitionIds.includes(Number(t.id));

  //       const payload: any = {
  //         name: t.name,
  //         workflow_id: id,
  //         status_id_from: t.status_id_from ?? statusMap.get(t.from),
  //         status_id_to: t.status_id_to ?? statusMap.get(t.to),
  //         updated_by: user_id,
  //       };

  //       if (isExisting) {
  //         await queryRunner.manager.update(Transition, { id: t.id }, payload);
  //         savedTransitions.push(t);
  //       } else {
  //         payload.created_by = user_id;

  //         const newTransition = queryRunner.manager.create(Transition, payload);
  //         const saved = await queryRunner.manager.save(
  //           Transition,
  //           newTransition,
  //         );
  //         savedTransitions.push(saved);
  //       }
  //     }

  //     // 8️⃣ Commit
  //     await queryRunner.commitTransaction();

  //     return {
  //       workflow,
  //       statuses: updatedDBStatuses,
  //       transitions: savedTransitions,
  //     };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  async remove(id: number, user_id: number) {
    const workflow = await this.workflowRepo.findOne({
      where: { id },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found or not owned by user');
    }
    return this.workflowRepo.remove(workflow);
  }
}
