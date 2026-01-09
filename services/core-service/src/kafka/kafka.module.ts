import { forwardRef, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AgentProducer } from './agent.producer';
import { AgentReplyConsumer } from './agent-reply.consumer';
import { CoreKafkaTopicService } from './core-kafka-topic.service';
import { IssueModule } from 'src/modules/issue/issue.module';


@Module({
  imports: [
    forwardRef(() => IssueModule), 
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'core-service-producer',
            brokers: ['localhost:9092'],
          },
          producerOnlyMode: true,
        },
      },
    ]),
    
  ],
  controllers: [AgentReplyConsumer],
  providers: [AgentProducer, CoreKafkaTopicService],
  exports: [AgentProducer],
})
export class KafkaModule {}
