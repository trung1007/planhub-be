import {
  EventPattern,
  Payload,
  Ctx,
  KafkaContext,
} from '@nestjs/microservices';
import { Controller, Logger } from '@nestjs/common';
import { IssueService } from 'src/modules/issue/issue.service';
import { CreateIssueDto } from 'src/modules/issue/dto/create-issue.dto';
import { IssueStatus } from 'src/enum/issue-status.enum';

@Controller()
export class AgentReplyConsumer {
  private readonly logger = new Logger(AgentReplyConsumer.name);

  constructor(private readonly issueService: IssueService) {}

  @EventPattern('agent.reply')
  async handleReply(@Payload() message: any, @Ctx() context: KafkaContext) {
    const value = message?.value ?? message;

    this.logger.log('📨 CORE RECEIVED REPLY');
    this.logger.log(`topic: ${context.getTopic()}`);
    this.logger.log(`partition: ${context.getPartition()}`);
    this.logger.log(`offset: ${context.getMessage().offset}`);
    this.logger.log(`commandId: ${value?.commandId}`);
    try {
      const parsed = this.parseAgentResult(value);

      if (!Array.isArray(parsed?.subtasks) || parsed.subtasks.length === 0) {
        this.logger.warn('No subtasks found in reply');
        return;
      }

      // ✅ user_id dùng cho created_by trong create()
      // Ưu tiên lấy từ message nếu có, fallback về reporter_id, cuối cùng fallback 1
      const userId =
        value?.user_id ??
        value?.userId ??
        value?.payload?.user_id ??
        value?.payload?.userId ??
        parsed?.subtasks?.[0]?.reporter_id ??
        1;
        

      for (const s of parsed.subtasks) {
        const dto: CreateIssueDto = {
          sprintId: s?.sprint_id ?? null,
          type: s?.type,
          name: s?.name,
          summary: s?.summary ?? null,
          description: s?.description ?? null,
          tags: Array.isArray(s?.tags) ? s.tags : null,
          status: this.normalizeStatus(s?.status),
          priority:
            typeof s?.priority === 'string'
              ? s.priority.toLowerCase()
              : (s?.priority ?? null),

          reporterId: s?.reporter_id ?? null,
          assigneeId: s?.assignee_id ?? null,
          parentIssueId: s?.parent_issue_id ?? null,
        };

        // guard tối thiểu
        if (!dto.name || !dto.type) {
          this.logger.warn(
            `Skip invalid subtask (missing name/type): ${JSON.stringify(s)}`,
          );
          continue;
        }

        const saved = await this.issueService.create(dto, userId);
      
        
        this.logger.log(`✅ Created issue id=${saved.id} name="${saved.name}"`);
      }
    } catch (err: any) {
      this.logger.error(`❌ handleReply error: ${err?.message ?? err}`);
    }
  }

  private parseAgentResult(value: any): any {
    const result = value?.result;

    if (!result) return null;

    // raw có thể là string JSON
    if (typeof result?.raw === 'string' && result.raw.trim()) {
      const raw = result.raw.trim();

      // phòng trường hợp raw có kèm chữ -> cắt JSON object
      const jsonText = this.extractJsonObject(raw);
      return JSON.parse(jsonText);
    }

    // hoặc agent đã trả object luôn
    if (Array.isArray(result?.subtasks)) return result;

    return null;
  }

  private extractJsonObject(text: string): string {
    const cleaned = text
      .replace(/```json/gi, '```')
      .replace(/```/g, '')
      .trim();

    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) {
      throw new Error('Result did not contain a JSON object');
    }
    return cleaned.slice(first, last + 1);
  }

  private normalizeStatus(input: any): IssueStatus | undefined {
    const ALLOWED_STATUSES = new Set(Object.values(IssueStatus));

    if (input === null || input === undefined) return undefined;

    const raw = String(input).trim();
    if (!raw) return undefined;

    let s = raw.toLowerCase().trim();

    // normalize vài biến thể phổ biến từ agent
    if (s === 'todo' || s === 'to-do' || s === 'to do') s = IssueStatus.TODO;
    else if (s === 'inprogress' || s === 'in-progress' || s === 'in progress')
      s = IssueStatus.IN_PROGRESS;

    // chuẩn hoá chung: khoảng trắng -> underscore
    s = s.replace(/\s+/g, '_');

    // ✅ chỉ trả về nếu nằm trong enum IssueStatus
    return ALLOWED_STATUSES.has(s as IssueStatus)
      ? (s as IssueStatus)
      : undefined;
  }
}
