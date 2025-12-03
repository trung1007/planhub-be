import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transition } from './transition.entity';
import { CreateTransitionDto, UpdateTransitionDto } from './dto/transition.dto';

@Injectable()
export class TransitionService {
  constructor(
    @InjectRepository(Transition)
    private readonly transitionRepo: Repository<Transition>,
  ) {}

  async findAll(workflowId: number) {
    const transitions = await this.transitionRepo.find({
      where: { workflow_id: workflowId },
      relations: ['from', 'to'],
      order: { id: 'ASC' },
    });

    return transitions.map((t) => ({
      id: t.id,
      name: t.name,
      status_id_from: t.status_id_from,
      status_id_to: t.status_id_to,

      from: t.from?.name ?? null,
      to: t.to?.name ?? null,

      created_at: t.created_at,
      updated_at: t.updated_at,
    }));
  }

  findOne(id: number) {
    return this.transitionRepo.findOne({
      where: { id },
      relations: ['from', 'to'],
    });
  }

  create(dto: CreateTransitionDto) {
    const transition = this.transitionRepo.create(dto);
    return this.transitionRepo.save(transition);
  }

  update(id: number, dto: UpdateTransitionDto) {
    return this.transitionRepo.update(id, dto);
  }

  remove(id: number) {
    return this.transitionRepo.delete(id);
  }
}
