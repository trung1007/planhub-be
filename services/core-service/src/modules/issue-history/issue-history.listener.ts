import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueHistory } from './issue-history.entity';
import { HistoryEvent } from './issue-history.event';

@Injectable()
export class IssueHistoryListener {
  constructor(
    @InjectRepository(IssueHistory)
    private repo: Repository<IssueHistory>,
  ) {}

  @OnEvent('history.create')
  async handle(event: HistoryEvent) {
    await this.repo.save({
      issue_id: event.issue_id,
      entity: event.entity,
      entity_id: event.entity_id,
      action: event.action,
      changed_by: event.changed_by,
      field: event.field ?? null,
      field_id:event.field_id ?? null,
      old_value: event.old_value ?? null,
      new_value: event.new_value ?? null,
      metadata: event.metadata ?? null,
    });
  }
}
