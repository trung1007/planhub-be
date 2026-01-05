// core-service/src/kafka/agent.producer.ts
import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { randomUUID } from 'crypto';

@Injectable()
export class AgentProducer {
  constructor(
    @Inject('KAFKA_CLIENT')
    private readonly kafka: ClientKafka,
  ) {}

  async sendCommand(payload: any) {
    const message = {
      commandId: randomUUID(),
      type: 'PROCESS_JOB',
      payload,
      retryCount: 0,
      replyTopic: 'agent.reply',
    };

    console.log('📤 Sending command:', message);

    this.kafka.emit('agent.command', {
      key: message.commandId,
      value: message,
    });

    return {
      commandId: message.commandId,
      status: 'SENT',
    };
  }
}
