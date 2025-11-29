import { HistoryAction, HistoryEntity } from './issue-history.entity';

export class HistoryEvent {
  constructor(
    public issue_id: number,
    public entity: HistoryEntity,
    public entity_id: number | null,
    public action: HistoryAction,
    public changed_by: number,
    public field_id?: number | null,
    public field?: string | null,
    public old_value?: any,
    public new_value?: any,
    public metadata?: any,
  ) {}
}
