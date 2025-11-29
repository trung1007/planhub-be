import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HistoryEvent } from './issue-history.event';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueHistory } from './issue-history.entity';
import {
  UserProxyEntity,
  UserServiceProxy,
} from 'src/shared/user-service.proxy';

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

  async getByIssue(issueId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [historyList, total] = await this.repo.findAndCount({
      where: { issue_id: issueId },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    const userIds = Array.from(
      new Set(
        historyList
          .map((item) => item.changed_by)
          .filter((id): id is number => id !== null),
      ),
    );

    const users: UserProxyEntity[] =
      userIds.length > 0 ? await this.userProxy.getUsersByIds(userIds) : [];

    // 3️⃣ Convert to Map for O(1) lookup
    const userMap = new Map<number, UserProxyEntity>(
      users.map((u) => [u.id, u]),
    );

    // 4️⃣ Map response
    const historyResponse = historyList.map((item) => {
      const actor = item.changed_by ? userMap.get(item.changed_by) : null;

      return {
        ...item,
        changeUser: actor?.username || null,
        changeName: actor?.fullName || null,
      };
    });


    return {
      data: historyResponse,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
