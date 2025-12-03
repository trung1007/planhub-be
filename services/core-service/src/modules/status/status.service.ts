import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from './status.entity';
import { CreateStatusDto, UpdateStatusDto } from './dto/status.dto';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(Status)
    private readonly statusRepo: Repository<Status>,
  ) {}

  findAll(workflowId: number) {
    return this.statusRepo.find({
      where: { workflow_id: workflowId },
      order: { id: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.statusRepo.findOne({ where: { id } });
  }

  create(dto: CreateStatusDto, user_id: number) {
    const status = this.statusRepo.create({
      workflow_id: dto.workflow_id,
      name: dto.name,
      color: dto.color,
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
