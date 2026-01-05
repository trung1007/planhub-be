import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class AgentProducer implements OnModuleInit {
  constructor(
    @Inject('KAFKA_CLIENT')
    private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
    this.sendDemoCommand();
  }

  async sendDemoCommand() {
    const message = {
      commandId: crypto.randomUUID(),
      type: 'PROCESS_JOB',
      payload: {
        ok: false, // đổi true để test success
      },
      retryCount: 0,
    };

    console.log('📤 Sending command:', message);

    this.kafka.emit('agent.command', {
      key: message.commandId,
      value: message,
    });
  }
}
