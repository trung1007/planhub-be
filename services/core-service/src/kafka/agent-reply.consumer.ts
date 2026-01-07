import {
  EventPattern,
  Payload,
  Ctx,
  KafkaContext,
} from '@nestjs/microservices';
import { Controller } from '@nestjs/common';

@Controller()
export class AgentReplyConsumer {

  @EventPattern('agent.reply')
  async handleReply(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    const value = message?.value ?? message;

    console.log('📨 CORE RECEIVED REPLY');
    console.log('topic:', context.getTopic());
    console.log('partition:', context.getPartition());
    console.log('offset:', context.getMessage().offset);
    console.log('commandId:', value.commandId);
    console.log(value.result.raw);
    
  }
}
