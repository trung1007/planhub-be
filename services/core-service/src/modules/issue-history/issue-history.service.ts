import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HistoryEvent } from './issue-history.event';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueHistory } from './issue-history.entity';
import { UserServiceProxy } from 'src/shared/user-service.proxy';

@Injectable()
export class IssueHistoryService {
  constructor(
    private eventEmitter: EventEmitter2,

    @InjectRepository(IssueHistory)
    private repo: Repository<IssueHistory>,

    private readonly userProxy: UserServiceProxy,
  ) {}

  /** Emit event để listener xử lý */
  log(event: HistoryEvent) {
    this.eventEmitter.emit('history.create', event);
  }

  /** Lấy danh sách history theo issueId */
  async getByIssue(issueId: number) {
    const historyList = await this.repo.find({
      where: { issue_id: issueId },
      order: { created_at: 'DESC' },
    });
    const historyResponse = await Promise.all(
      historyList.map(async (item) => {
        const actorChange = item.changed_by
          ? await this.userProxy.getUserById(item.changed_by)
          : null;
        return {
          ...item,
          changeUser: actorChange?.username || null,
          changeName: actorChange?.fullName || null,
        };
      }),
    );
    return historyResponse;
  }
}
