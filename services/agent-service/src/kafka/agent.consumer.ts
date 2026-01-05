import { Controller, Inject } from '@nestjs/common';
import {
  ClientKafka,
  Ctx,
  KafkaContext,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';

@Controller()
export class AgentConsumer {
  private readonly MAX_RETRY = 3;

  constructor(
    @Inject('KAFKA_CLIENT')
    private readonly kafka: ClientKafka,
  ) {}

  @MessagePattern('agent.command')
  async handleCommand(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    const value = message.value;
    const retryCount = value.retryCount ?? 0;

    console.log(`📥 Received command (retry=${retryCount})`, value);

    try {
      await this.process(value.payload);
      console.log('✅ Process success');
    } catch (error) {
      console.log('❌ Process failed:', error.message);

      if (retryCount < this.MAX_RETRY) {
        this.sendToRetry(value, retryCount, error);
      } else {
        this.sendToDLQ(value, error);
      }
    }
  }

  private async process(payload: any) {
    if (!payload.ok) {
      throw new Error('Business error');
    }
  }

  private sendToRetry(value: any, retryCount: number, error: Error) {
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

  private sendToDLQ(value: any, error: Error) {
    this.kafka.emit('agent.command.dlq', {
      key: value.commandId,
      value,
      headers: {
        'x-error-message': error.message,
        'x-origin-service': 'agent-service',
      },
    });

    console.log('☠️ Sent to DLQ:', value.commandId);
  }
}
