import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import {
  ClientKafka,
  EventPattern,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { GeminiSubtasksService } from 'src/subtasks/gemini-subtasks.service';

@Controller()
export class AgentConsumer implements OnModuleInit {
  private readonly MAX_RETRY = 3;

  constructor(
    @Inject('KAFKA_CLIENT')
    private readonly kafka: ClientKafka,
    private readonly geminiSubtasksService: GeminiSubtasksService,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
    console.log('✅ Kafka producer connected (agent-service)');
  }

  @EventPattern('agent.command')
  async handleCommand(@Payload() payload: any) {
    // ✅ NestJS có thể truyền thẳng value
    const value = payload?.data ?? payload;

    console.log('value from message kafka:', value);

    if (!value) {
      console.error('❌ Received empty Kafka message');
      return;
    }

    const retryCount = value.retryCount ?? 0;

    // console.log(
    //   `📥 [AGENT] Received command (retry=${retryCount})`,
    //   JSON.stringify(value),
    // );

    try {
      // const result = await this.process(value.payload);

      // console.log(`✅ [AGENT] Process success ${value.commandId}`);

      // // ✅ Reply SUCCESS
      // this.sendReplySuccess(value, result);

      const geminiResult = await this.geminiSubtasksService.generate({
        run_id: String(value.commandId),
        issue: {
          name: value.payload?.data?.name,
          summary: value.payload?.data?.summary,
          description: value.payload?.data?.description,
          type: value.payload?.data?.type,
          tags: value.payload?.data?.tags,
          priority: value.payload?.data?.priority,
          status: value.payload?.data?.status,
          list_status: value.payload?.data?.statusList,
          project: value.payload?.data?.projectName,
          sprint:value.payload?.data?.activeSprint,
          release:value.payload?.data?.releaseName,
        },
        max_subtasks: value.payload.max_subtasks ?? 6,
        language: value.payload.language ?? 'vi',
      });

      /**
       * 2️⃣ Nếu Gemini trả lỗi logic (không throw)
       */
      if (geminiResult.error) {
        throw new Error(geminiResult.error);
      }

      console.log(`✅ [AGENT] Gemini success commandId=${value.commandId}`);

      /**
       * 3️⃣ REPLY SUCCESS → core-service
       */
      this.sendReplySuccess(value, geminiResult);
    } catch (error: any) {
      console.error(
        `❌ [AGENT] Process failed ${value.commandId}:`,
        error.message,
      );

      if (retryCount < this.MAX_RETRY) {
        this.sendToRetry(value, retryCount, error);
      } else {
        // ❌ Retry hết → DLQ + reply FAILED
        this.sendToDLQ(value, error);
        this.sendReplyFailed(value, error);
      }
    }
  }

  // ================= BUSINESS =================

  private async process(payload: any) {
    if (!payload?.ok) {
      throw new Error('Business error');
    }

    return {
      processedAt: new Date().toISOString(),
    };
  }

  // ================= RETRY =================

  private sendToRetry(value: any, retryCount: number, error: Error) {
    console.log(`🔁 [AGENT] Retry ${value.commandId} (${retryCount + 1})`);

    this.kafka.emit('agent.command.retry', {
      key: value.commandId,
      value: {
        ...value,
        retryCount: retryCount + 1,
      },
      headers: {
        'x-error-message': error.message,
      },
    });
  }

  // ================= DLQ =================

  private sendToDLQ(value: any, error: Error) {
    this.kafka.emit('agent.command.dlq', {
      key: value.commandId,
      value,
      headers: {
        'x-error-message': error.message,
        'x-origin-service': 'agent-service',
      },
    });

    console.error(`☠️ [AGENT] Sent to DLQ ${value.commandId}`);
  }

  // ================= REPLY =================

  private sendReplySuccess(value: any, result: any) {
    if (!value.replyTopic) {
      console.warn(`⚠️ [AGENT] No replyTopic for ${value.commandId}`);
      return;
    }

    this.kafka.emit(value.replyTopic, {
      key: value.commandId,
      value: {
        commandId: value.commandId,
        status: 'SUCCESS',
        result,
      },
    });
  }

  private sendReplyFailed(value: any, error: Error) {
    if (!value.replyTopic) {
      console.warn(`⚠️ [AGENT] No replyTopic for ${value.commandId}`);
      return;
    }

    this.kafka.emit(value.replyTopic, {
      key: value.commandId,
      value: {
        commandId: value.commandId,
        status: 'FAILED',
        error: error.message,
      },
    });
  }
}
