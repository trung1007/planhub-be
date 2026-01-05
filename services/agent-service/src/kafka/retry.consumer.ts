import { Controller, Inject } from '@nestjs/common';
import {
  ClientKafka,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';

@Controller()
export class RetryConsumer {
  constructor(
    @Inject('KAFKA_CLIENT')
    private readonly kafka: ClientKafka,
  ) {}

  @MessagePattern('agent.command.retry')
  async handleRetry(@Payload() message: any) {
    console.log('🔁 Retry message received');

    // delay 5s
    await new Promise(res => setTimeout(res, 5000));

    this.kafka.emit('agent.command', message);
  }
}
